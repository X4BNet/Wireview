import { computed, reactive, shallowReactive, watch } from "vue";
import { clamp } from "../util.js";
import Bridge from "./Bridge.js";
import FrameDetailsTree from "./FrameDetailsTree.js";

class Manager {
  #core;
  #state;
  #shallowState;
  #disposed = false;

  constructor(options) {
    this.#core = {
      bridge: new Bridge(options),
      checkFilterCache: new Map(),
    };
    this.#state = reactive({
      rowHeight: 28, // TODO: Originally I thought we'd manipulate this to change text size, but in-browser zoom seems to work fine for this
      activeFrameIndex: null,
      displayFilter: "",
      findFrameBarHidden: true,

      // computed
      fontSize: 0,
      activeFrameNumber: null,
      packetCount: 0,
      frameCount: 0,
      canOpenFile: false,
    });
    this.#shallowState = shallowReactive({
      activeFrameDetails: null,
      activeFieldInfo: null,
      sessionInfo: null,
      filteredFrames: null,
      filteredFramesRequest: null,
      activeFile: null,
      lastFileOpenError: false,
    });
    this.#state.fontSize = computed(() =>
      14
    );
    this.#state.activeFrameNumber = computed(() => {
      const index = this.#state.activeFrameIndex;
      if (index === null) return null;
      return this.#shallowState.filteredFrames?.[index]?.number ?? index + 1;
    });
    this.#state.packetCount = computed(
      () => this.#shallowState.sessionInfo?.packet_count ?? 0
    );
    this.#state.frameCount = computed(
      () => this.#shallowState.filteredFrames?.length ?? this.#state.packetCount
    );
    this.#state.canOpenFile = computed(
      () =>
        this.#core.bridge.initialized &&
        (!this.#shallowState.activeFile || this.#shallowState.sessionInfo)
    );
    watch(
      () => this.#state.displayFilter,
      async (filter) => {
        if (this.#shallowState.sessionInfo === null) return;

        // get currently active frame
        const frameNumber =
          this.#shallowState.filteredFramesRequest?.frameNumber ??
          this.#state.activeFrameNumber;

        if (filter === "") {
          this.#shallowState.filteredFrames = null;
          this.#shallowState.filteredFramesRequest = null;
          if (frameNumber) this.#state.activeFrameIndex = frameNumber - 1;
          return;
        }

        this.#shallowState.filteredFrames = [];
        this.#shallowState.filteredFramesRequest = {
          promise: this.#core.bridge.getFrames(filter, 0, 0),
          frameNumber,
        };
        const request = this.#shallowState.filteredFramesRequest;
        let frames;
        try { frames = await request.promise; } catch { return; }
        if (this.#disposed || request !== this.#shallowState.filteredFramesRequest || filter !== this.#state.displayFilter) return;

        this.#shallowState.filteredFrames = frames;
        this.#shallowState.filteredFramesRequest.frameNumber = null;
        this.#state.activeFrameIndex =
          this.#getFrameIndex(frameNumber) ?? (frames.length ? 0 : null);
      }
    );

    // This watcher isn't a computed property because of the async request
    watch(
      () => this.#state.activeFrameNumber,
      async (frameNumber) => {
        if (frameNumber === null || frameNumber <= 0) {
          this.#shallowState.activeFrameDetails = null;
          return;
        }
        let rawFrameDetails;
        try { rawFrameDetails = await this.#core.bridge.getFrame(frameNumber); } catch { return; }
        if (this.#disposed || frameNumber !== this.#state.activeFrameNumber) return;
        this.#shallowState.activeFieldInfo = null;
        this.#shallowState.activeFrameDetails = new FrameDetailsTree(
          rawFrameDetails
        );
      }
    );
  }

  get initialized() {
    return this.#core.bridge.initialized;
  }

  get columns() {
    return this.#core.bridge.columns;
  }

  get activeBridgeRequest() {
    return this.#core.bridge.activeRequest;
  }

  get rowHeight() {
    return this.#state.rowHeight;
  }

  get fontSize() {
    return this.#state.fontSize;
  }

  get displayFilter() {
    return this.#state.displayFilter;
  }

  async setDisplayFilter(filter) {
    const result = await this.checkFilter(filter);
    if (result.ok) this.#state.displayFilter = filter;
  }

  get activeFrameNumber() {
    return this.#state.activeFrameNumber;
  }

  get activeFrameIndex() {
    return this.#state.activeFrameIndex;
  }

  setActiveFrameIndex(index) {
    if (index < 0) index = this.#state.frameCount + index;
    this.#state.activeFrameIndex = index;
  }

  setActiveFrameNumber(number) {
    if (this.displayFilter == "") {
      this.#state.activeFrameIndex = number - 1;
      return;
    }

    const frames = this.#shallowState.filteredFrames;

    if (frames === null)
      return console.error("TODO: wait for filtered frames to load");

    const n = frames.length;
    if (n === 0) return;

    // binary search
    let i = 0;
    for (let jump = n; jump; jump >>= 1)
      while (i + jump < n && frames[i + jump].number <= number) i += jump;

    if (frames[i].number === number) this.#state.activeFrameIndex = i;
    else console.error("Could not find frame", number);
  }

  get packetCount() {
    return this.#state.packetCount;
  }

  get frameCount() {
    return this.#state.frameCount;
  }

  get findFrameBarHidden() {
    return this.#state.findFrameBarHidden;
  }

  get activeFile() {
    return this.#shallowState.activeFile;
  }

  get lastFileOpenError() {
    return this.#shallowState.lastFileOpenError;
  }

  get canOpenFile() {
    return this.#state.canOpenFile;
  }

  get sessionInfo() {
    return this.#shallowState.sessionInfo;
  }

  get activeFrameDetails() {
    return this.#shallowState.activeFrameDetails;
  }

  get activeFieldInfo() {
    return this.#shallowState.activeFieldInfo;
  }

  setActiveFieldInfo(field_info_ptr, range = null) {
    this.#shallowState.activeFieldInfo = { ptr: field_info_ptr, range };
  }

  get canGoToPreviousPacket() {
    if (this.#state.activeFrameIndex === null) return false;
    return this.#state.activeFrameIndex > 0;
  }

  get canGoToNextPacket() {
    if (this.#state.activeFrameIndex === null) return false;
    return this.#state.activeFrameIndex + 1 < this.#state.frameCount;
  }

  goToNearbyPacket(distance) {
    if (this.#state.activeFrameIndex === null) return;

    const minDistance = -this.#state.activeFrameIndex;
    const maxDistance =
      this.#state.frameCount - 1 - this.#state.activeFrameIndex;
    distance = clamp(minDistance, distance, maxDistance);
    this.#state.activeFrameIndex += distance;
  }

  initialize() {
    return this.#core.bridge.initialize();
  }

  deinitialize() {
    this.#disposed = true;
    this.#core.bridge.deinitialize();
  }

  async openFile(file) {
    if (this.#shallowState.activeFile) await this.closeFile();

    this.#shallowState.activeFile = file;
    let result;
    try { result = await this.#core.bridge.createSession(file); }
    catch (error) {
      this.#shallowState.activeFile = null;
      throw error;
    }

    // handle error
    if (result.code) {
      this.#shallowState.lastFileOpenError = {
        ...result,
        filename: file.name,
      };
      this.#shallowState.activeFile = null;
      await this.#core.bridge.closeSession();
      throw new Error(result.error || `Unable to parse ${file.name}`);
    }

    if (this.#disposed) throw new Error("Wireview was closed");
    this.#shallowState.sessionInfo = result.summary;
    this.#state.activeFrameIndex = result.summary.packet_count ? 0 : null;
  }

  async closeFile() {
    this.#state.activeFrameIndex = null;
    this.#state.displayFilter = "";
    this.#shallowState.filteredFrames = null;
    this.#shallowState.filteredFramesRequest = null;
    this.#shallowState.activeFieldInfo = null;
    this.#core.checkFilterCache.clear();
    this.#shallowState.sessionInfo = null;
    this.#shallowState.lastFileOpenError = null;
    this.#shallowState.activeFile = null;
    await this.#core.bridge.closeSession();
  }

  // say you want n frames from the mth position
  // n = limit, m = skip
  // returns a frames array, where you should start reading from frames[offset]
  async getFrames(filter, skip, limit) {
    if (this.#shallowState.sessionInfo === null)
      return { frames: [], offset: 0 };

    if (
      filter === this.#state.displayFilter &&
      this.#shallowState.filteredFramesRequest
    ) {
      const frames = await this.#shallowState.filteredFramesRequest.promise;
      return { frames, offset: skip };
    }
    const frames = await this.#core.bridge.getFrames(filter, skip, limit);
    return { frames, offset: 0 };
  }

  async checkFilter(filter) {
    if (!this.#core.checkFilterCache.has(filter)) {
      const result = await this.#core.bridge.checkFilter(filter);
      this.#core.checkFilterCache.set(filter, result);
    }
    return this.#core.checkFilterCache.get(filter);
  }

  async findFrame(params) {
    return this.#core.bridge.findFrame(params);
  }

  // returns index of the largest frame that has a number smaller or equal to the passed frame number
  // returns null if it does not exist
  #getFrameIndex(frameNumber) {
    if (frameNumber === null) return null;

    const frames = this.#shallowState.filteredFrames;
    if (frames === null) return frameNumber ? frameNumber - 1 : null;

    // binary search, the way I like it
    let index = 0;
    for (let n = frames.length; n; n >>= 1)
      while (
        index + n < frames.length &&
        frames[index + n].number <= frameNumber
      )
        index += n;

    return index;
  }

  setFindFrameBarHidden(state) {
    this.#state.findFrameBarHidden = state ?? !this.#state.findFrameBarHidden;
  }
}

export default Manager;
