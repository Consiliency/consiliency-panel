"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// ../core/src/metadata.ts
var MetadataCollector;
var init_metadata = __esm({
  "../core/src/metadata.ts"() {
    "use strict";
    MetadataCollector = class {
      constructor() {
        __publicField(this, "consoleErrorBuffer", []);
        __publicField(this, "consoleWarningBuffer", []);
        __publicField(this, "originalConsoleError");
        __publicField(this, "originalConsoleWarn");
        __publicField(this, "originalOnError", null);
        this.originalConsoleError = console.error.bind(console);
        console.error = (...args) => {
          this.consoleErrorBuffer.push(args.map(String).join(" "));
          this.originalConsoleError(...args);
        };
        this.originalConsoleWarn = console.warn.bind(console);
        console.warn = (...args) => {
          this.consoleWarningBuffer.push(args.map(String).join(" "));
          this.originalConsoleWarn(...args);
        };
        if (typeof window !== "undefined") {
          this.originalOnError = window.onerror;
          window.onerror = (msg, src, line, col, err) => {
            this.consoleErrorBuffer.push(
              `Uncaught ${err?.name ?? "Error"}: ${msg} (${src}:${line}:${col})`
            );
            return this.originalOnError?.(msg, src, line, col, err) ?? false;
          };
        }
      }
      collect() {
        return {
          url: typeof window !== "undefined" ? window.location.href : "",
          title: typeof document !== "undefined" ? document.title : "",
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          viewport: typeof window !== "undefined" ? { width: window.innerWidth, height: window.innerHeight } : { width: 0, height: 0 },
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          referrer: typeof document !== "undefined" ? document.referrer : ""
        };
      }
      collectConsoleErrors() {
        return [...this.consoleErrorBuffer];
      }
      flushConsoleErrors() {
        const errors = [...this.consoleErrorBuffer];
        this.consoleErrorBuffer = [];
        return errors;
      }
      collectConsoleWarnings() {
        return [...this.consoleWarningBuffer];
      }
      flushConsoleWarnings() {
        const warnings = [...this.consoleWarningBuffer];
        this.consoleWarningBuffer = [];
        return warnings;
      }
      destroy() {
        console.error = this.originalConsoleError;
        console.warn = this.originalConsoleWarn;
        if (typeof window !== "undefined" && this.originalOnError !== null) {
          window.onerror = this.originalOnError;
        }
      }
    };
  }
});

// ../../node_modules/.pnpm/modern-screenshot@4.6.8/node_modules/modern-screenshot/dist/index.mjs
var dist_exports = {};
__export(dist_exports, {
  createContext: () => createContext,
  destroyContext: () => destroyContext,
  domToBlob: () => domToBlob,
  domToCanvas: () => domToCanvas,
  domToDataUrl: () => domToDataUrl,
  domToForeignObjectSvg: () => domToForeignObjectSvg,
  domToImage: () => domToImage,
  domToJpeg: () => domToJpeg,
  domToPixel: () => domToPixel,
  domToPng: () => domToPng,
  domToSvg: () => domToSvg,
  domToWebp: () => domToWebp,
  loadMedia: () => loadMedia,
  waitUntilLoad: () => waitUntilLoad
});
function changeJpegDpi(uint8Array, dpi) {
  uint8Array[13] = 1;
  uint8Array[14] = dpi >> 8;
  uint8Array[15] = dpi & 255;
  uint8Array[16] = dpi >> 8;
  uint8Array[17] = dpi & 255;
  return uint8Array;
}
function createPngDataTable() {
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}
function calcCrc(uint8Array) {
  let c = -1;
  if (!pngDataTable)
    pngDataTable = createPngDataTable();
  for (let n = 0; n < uint8Array.length; n++) {
    c = pngDataTable[(c ^ uint8Array[n]) & 255] ^ c >>> 8;
  }
  return c ^ -1;
}
function searchStartOfPhys(uint8Array) {
  const length = uint8Array.length - 1;
  for (let i = length; i >= 4; i--) {
    if (uint8Array[i - 4] === 9 && uint8Array[i - 3] === _P && uint8Array[i - 2] === _H && uint8Array[i - 1] === _Y && uint8Array[i] === _S) {
      return i - 3;
    }
  }
  return 0;
}
function changePngDpi(uint8Array, dpi, overwritepHYs = false) {
  const physChunk = new Uint8Array(13);
  dpi *= 39.3701;
  physChunk[0] = _P;
  physChunk[1] = _H;
  physChunk[2] = _Y;
  physChunk[3] = _S;
  physChunk[4] = dpi >>> 24;
  physChunk[5] = dpi >>> 16;
  physChunk[6] = dpi >>> 8;
  physChunk[7] = dpi & 255;
  physChunk[8] = physChunk[4];
  physChunk[9] = physChunk[5];
  physChunk[10] = physChunk[6];
  physChunk[11] = physChunk[7];
  physChunk[12] = 1;
  const crc = calcCrc(physChunk);
  const crcChunk = new Uint8Array(4);
  crcChunk[0] = crc >>> 24;
  crcChunk[1] = crc >>> 16;
  crcChunk[2] = crc >>> 8;
  crcChunk[3] = crc & 255;
  if (overwritepHYs) {
    const startingIndex = searchStartOfPhys(uint8Array);
    uint8Array.set(physChunk, startingIndex);
    uint8Array.set(crcChunk, startingIndex + 13);
    return uint8Array;
  } else {
    const chunkLength = new Uint8Array(4);
    chunkLength[0] = 0;
    chunkLength[1] = 0;
    chunkLength[2] = 0;
    chunkLength[3] = 9;
    const finalHeader = new Uint8Array(54);
    finalHeader.set(uint8Array, 0);
    finalHeader.set(chunkLength, 33);
    finalHeader.set(physChunk, 37);
    finalHeader.set(crcChunk, 50);
    return finalHeader;
  }
}
function detectPhysChunkFromDataUrl(dataUrl) {
  let b64index = dataUrl.indexOf(b64PhysSignature1);
  if (b64index === -1) {
    b64index = dataUrl.indexOf(b64PhysSignature2);
  }
  if (b64index === -1) {
    b64index = dataUrl.indexOf(b64PhysSignature3);
  }
  return b64index;
}
function supportWebp(ownerDocument) {
  const canvas = ownerDocument?.createElement?.("canvas");
  if (canvas) {
    canvas.height = canvas.width = 1;
  }
  return Boolean(canvas) && "toDataURL" in canvas && Boolean(canvas.toDataURL("image/webp").includes("image/webp"));
}
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i))
    return url;
  if (IN_BROWSER && url.match(/^\/\//))
    return window.location.protocol + url;
  if (url.match(/^[a-z]+:/i))
    return url;
  if (!IN_BROWSER)
    return url;
  const doc = getDocument().implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a);
  if (baseUrl)
    base.href = baseUrl;
  a.href = url;
  return a.href;
}
function getDocument(target) {
  return (target && isElementNode(target) ? target?.ownerDocument : target) ?? window.document;
}
function createSvg(width, height, ownerDocument) {
  const svg = getDocument(ownerDocument).createElementNS(XMLNS, "svg");
  svg.setAttributeNS(null, "width", width.toString());
  svg.setAttributeNS(null, "height", height.toString());
  svg.setAttributeNS(null, "viewBox", `0 0 ${width} ${height}`);
  return svg;
}
function svgToDataUrl(svg, removeControlCharacter) {
  let xhtml = new XMLSerializer().serializeToString(svg);
  if (removeControlCharacter) {
    xhtml = xhtml.replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF\uFFFE\uFFFF]/gu, "");
  }
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xhtml)}`;
}
async function canvasToBlob(canvas, type = "image/png", quality = 1) {
  try {
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Blob is null"));
        }
      }, type, quality);
    });
  } catch (error) {
    if (SUPPORT_ATOB) {
      return dataUrlToBlob(canvas.toDataURL(type, quality));
    }
    throw error;
  }
}
function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const type = header.match(/data:(.+);/)?.[1] ?? void 0;
  const decoded = window.atob(base64);
  const length = decoded.length;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    buffer[i] = decoded.charCodeAt(i);
  }
  return new Blob([buffer], { type });
}
function readBlob(blob, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error(`Failed read blob to ${type}`));
    if (type === "dataUrl") {
      reader.readAsDataURL(blob);
    } else if (type === "arrayBuffer") {
      reader.readAsArrayBuffer(blob);
    }
  });
}
function createImage(url, ownerDocument) {
  const img = getDocument(ownerDocument).createElement("img");
  img.decoding = "sync";
  img.loading = "eager";
  img.src = url;
  return img;
}
function loadMedia(media, options) {
  return new Promise((resolve) => {
    const { timeout, ownerDocument, onError: userOnError, onWarn } = options ?? {};
    const node = typeof media === "string" ? createImage(media, getDocument(ownerDocument)) : media;
    let timer = null;
    let removeEventListeners = null;
    function onResolve() {
      resolve(node);
      timer && clearTimeout(timer);
      removeEventListeners?.();
    }
    if (timeout) {
      timer = setTimeout(onResolve, timeout);
    }
    if (isVideoElement(node)) {
      const currentSrc = node.currentSrc || node.src;
      if (!currentSrc) {
        if (node.poster) {
          return loadMedia(node.poster, options).then(resolve);
        }
        return onResolve();
      }
      if (node.readyState >= 2) {
        return onResolve();
      }
      const onLoadeddata = onResolve;
      const onError = (error) => {
        onWarn?.(
          "Failed video load",
          currentSrc,
          error
        );
        userOnError?.(error);
        onResolve();
      };
      removeEventListeners = () => {
        node.removeEventListener("loadeddata", onLoadeddata);
        node.removeEventListener("error", onError);
      };
      node.addEventListener("loadeddata", onLoadeddata, { once: true });
      node.addEventListener("error", onError, { once: true });
    } else {
      const currentSrc = isSVGImageElementNode(node) ? node.href.baseVal : node.currentSrc || node.src;
      if (!currentSrc) {
        return onResolve();
      }
      const onLoad = async () => {
        if (isImageElement(node) && "decode" in node) {
          try {
            await node.decode();
          } catch (error) {
            onWarn?.(
              "Failed to decode image, trying to render anyway",
              node.dataset.originalSrc || currentSrc,
              error
            );
          }
        }
        onResolve();
      };
      const onError = (error) => {
        onWarn?.(
          "Failed image load",
          node.dataset.originalSrc || currentSrc,
          error
        );
        onResolve();
      };
      if (isImageElement(node) && node.complete) {
        return onLoad();
      }
      removeEventListeners = () => {
        node.removeEventListener("load", onLoad);
        node.removeEventListener("error", onError);
      };
      node.addEventListener("load", onLoad, { once: true });
      node.addEventListener("error", onError, { once: true });
    }
  });
}
async function waitUntilLoad(node, options) {
  if (isHTMLElementNode(node)) {
    if (isImageElement(node) || isVideoElement(node)) {
      await loadMedia(node, options);
    } else {
      await Promise.all(
        ["img", "video"].flatMap((selectors) => {
          return Array.from(node.querySelectorAll(selectors)).map((el) => loadMedia(el, options));
        })
      );
    }
  }
}
function splitFontFamily(fontFamily) {
  return fontFamily?.split(",").map((val) => val.trim().replace(/"|'/g, "").toLowerCase()).filter(Boolean);
}
function createLogger(debug) {
  const prefix = `${PREFIX}[#${uid}]`;
  uid++;
  return {
    // eslint-disable-next-line no-console
    time: (label) => debug && console.time(`${prefix} ${label}`),
    // eslint-disable-next-line no-console
    timeEnd: (label) => debug && console.timeEnd(`${prefix} ${label}`),
    warn: (...args) => debug && consoleWarn(...args)
  };
}
function getDefaultRequestInit(bypassingCache) {
  return {
    cache: bypassingCache ? "no-cache" : "force-cache"
  };
}
async function orCreateContext(node, options) {
  return isContext(node) ? node : createContext(node, { ...options, autoDestruct: true });
}
async function createContext(node, options) {
  const { scale = 1, workerUrl, workerNumber = 1 } = options || {};
  const debug = Boolean(options?.debug);
  const features = options?.features ?? true;
  const ownerDocument = node.ownerDocument ?? (IN_BROWSER ? window.document : void 0);
  const ownerWindow = node.ownerDocument?.defaultView ?? (IN_BROWSER ? window : void 0);
  const requests = /* @__PURE__ */ new Map();
  const context = {
    // Options
    width: 0,
    height: 0,
    quality: 1,
    type: "image/png",
    scale,
    backgroundColor: null,
    style: null,
    filter: null,
    maximumCanvasSize: 0,
    timeout: 3e4,
    progress: null,
    debug,
    fetch: {
      requestInit: getDefaultRequestInit(options?.fetch?.bypassingCache),
      placeholderImage: "data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      bypassingCache: false,
      ...options?.fetch
    },
    fetchFn: null,
    font: {},
    drawImageInterval: 100,
    workerUrl: null,
    workerNumber,
    onCloneEachNode: null,
    onCloneNode: null,
    onEmbedNode: null,
    onCreateForeignObjectSvg: null,
    includeStyleProperties: null,
    autoDestruct: false,
    ...options,
    // InternalContext
    __CONTEXT__: true,
    log: createLogger(debug),
    node,
    ownerDocument,
    ownerWindow,
    dpi: scale === 1 ? null : 96 * scale,
    svgStyleElement: createStyleElement(ownerDocument),
    svgDefsElement: ownerDocument?.createElementNS(XMLNS, "defs"),
    svgStyles: /* @__PURE__ */ new Map(),
    defaultComputedStyles: /* @__PURE__ */ new Map(),
    workers: [
      ...Array.from({
        length: SUPPORT_WEB_WORKER && workerUrl && workerNumber ? workerNumber : 0
      })
    ].map(() => {
      try {
        const worker = new Worker(workerUrl);
        worker.onmessage = async (event) => {
          const { url, result } = event.data;
          if (result) {
            requests.get(url)?.resolve?.(result);
          } else {
            requests.get(url)?.reject?.(new Error(`Error receiving message from worker: ${url}`));
          }
        };
        worker.onmessageerror = (event) => {
          const { url } = event.data;
          requests.get(url)?.reject?.(new Error(`Error receiving message from worker: ${url}`));
        };
        return worker;
      } catch (error) {
        context.log.warn("Failed to new Worker", error);
        return null;
      }
    }).filter(Boolean),
    fontFamilies: /* @__PURE__ */ new Map(),
    fontCssTexts: /* @__PURE__ */ new Map(),
    acceptOfImage: `${[
      supportWebp(ownerDocument) && "image/webp",
      "image/svg+xml",
      "image/*",
      "*/*"
    ].filter(Boolean).join(",")};q=0.8`,
    requests,
    drawImageCount: 0,
    tasks: [],
    features,
    isEnable: (key) => {
      if (key === "restoreScrollPosition") {
        return typeof features === "boolean" ? false : features[key] ?? false;
      }
      if (typeof features === "boolean") {
        return features;
      }
      return features[key] ?? true;
    },
    shadowRoots: []
  };
  context.log.time("wait until load");
  await waitUntilLoad(node, { timeout: context.timeout, onWarn: context.log.warn });
  context.log.timeEnd("wait until load");
  const { width, height } = resolveBoundingBox(node, context);
  context.width = width;
  context.height = height;
  return context;
}
function createStyleElement(ownerDocument) {
  if (!ownerDocument)
    return void 0;
  const style = ownerDocument.createElement("style");
  const cssText = style.ownerDocument.createTextNode(`
.______background-clip--text {
  background-clip: text;
  -webkit-background-clip: text;
}
`);
  style.appendChild(cssText);
  return style;
}
function resolveBoundingBox(node, context) {
  let { width, height } = context;
  if (isElementNode(node) && (!width || !height)) {
    const box = node.getBoundingClientRect();
    width = width || box.width || Number(node.getAttribute("width")) || 0;
    height = height || box.height || Number(node.getAttribute("height")) || 0;
  }
  return { width, height };
}
async function imageToCanvas(image, context) {
  const {
    log,
    timeout,
    drawImageCount,
    drawImageInterval
  } = context;
  log.time("image to canvas");
  const loaded = await loadMedia(image, { timeout, onWarn: context.log.warn });
  const { canvas, context2d } = createCanvas(image.ownerDocument, context);
  const drawImage = () => {
    try {
      context2d?.drawImage(loaded, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      context.log.warn("Failed to drawImage", error);
    }
  };
  drawImage();
  if (context.isEnable("fixSvgXmlDecode")) {
    for (let i = 0; i < drawImageCount; i++) {
      await new Promise((resolve) => {
        setTimeout(() => {
          context2d?.clearRect(0, 0, canvas.width, canvas.height);
          drawImage();
          resolve();
        }, i + drawImageInterval);
      });
    }
  }
  context.drawImageCount = 0;
  log.timeEnd("image to canvas");
  return canvas;
}
function createCanvas(ownerDocument, context) {
  const { width, height, scale, backgroundColor, maximumCanvasSize: max } = context;
  const canvas = ownerDocument.createElement("canvas");
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  if (max) {
    if (canvas.width > max || canvas.height > max) {
      if (canvas.width > max && canvas.height > max) {
        if (canvas.width > canvas.height) {
          canvas.height *= max / canvas.width;
          canvas.width = max;
        } else {
          canvas.width *= max / canvas.height;
          canvas.height = max;
        }
      } else if (canvas.width > max) {
        canvas.height *= max / canvas.width;
        canvas.width = max;
      } else {
        canvas.width *= max / canvas.height;
        canvas.height = max;
      }
    }
  }
  const context2d = canvas.getContext("2d");
  if (context2d && backgroundColor) {
    context2d.fillStyle = backgroundColor;
    context2d.fillRect(0, 0, canvas.width, canvas.height);
  }
  return { canvas, context2d };
}
function cloneCanvas(canvas, context) {
  if (canvas.ownerDocument) {
    try {
      const dataURL = canvas.toDataURL();
      if (dataURL !== "data:,") {
        return createImage(dataURL, canvas.ownerDocument);
      }
    } catch (error) {
      context.log.warn("Failed to clone canvas", error);
    }
  }
  const cloned = canvas.cloneNode(false);
  const ctx = canvas.getContext("2d");
  const clonedCtx = cloned.getContext("2d");
  try {
    if (ctx && clonedCtx) {
      clonedCtx.putImageData(
        ctx.getImageData(0, 0, canvas.width, canvas.height),
        0,
        0
      );
    }
    return cloned;
  } catch (error) {
    context.log.warn("Failed to clone canvas", error);
  }
  return cloned;
}
function cloneIframe(iframe, context) {
  try {
    if (iframe?.contentDocument?.body) {
      return cloneNode(iframe.contentDocument.body, context);
    }
  } catch (error) {
    context.log.warn("Failed to clone iframe", error);
  }
  return iframe.cloneNode(false);
}
function cloneImage(image) {
  const cloned = image.cloneNode(false);
  if (image.currentSrc && image.currentSrc !== image.src) {
    cloned.src = image.currentSrc;
    cloned.srcset = "";
  }
  if (cloned.loading === "lazy") {
    cloned.loading = "eager";
  }
  return cloned;
}
async function cloneVideo(video, context) {
  if (video.ownerDocument && !video.currentSrc && video.poster) {
    return createImage(video.poster, video.ownerDocument);
  }
  const cloned = video.cloneNode(false);
  cloned.crossOrigin = "anonymous";
  if (video.currentSrc && video.currentSrc !== video.src) {
    cloned.src = video.currentSrc;
  }
  const ownerDocument = cloned.ownerDocument;
  if (ownerDocument) {
    let canPlay = true;
    await loadMedia(cloned, { onError: () => canPlay = false, onWarn: context.log.warn });
    if (!canPlay) {
      if (video.poster) {
        return createImage(video.poster, video.ownerDocument);
      }
      return cloned;
    }
    cloned.currentTime = video.currentTime;
    await new Promise((resolve) => {
      cloned.addEventListener("seeked", resolve, { once: true });
    });
    const canvas = ownerDocument.createElement("canvas");
    canvas.width = video.offsetWidth;
    canvas.height = video.offsetHeight;
    try {
      const ctx = canvas.getContext("2d");
      if (ctx)
        ctx.drawImage(cloned, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      context.log.warn("Failed to clone video", error);
      if (video.poster) {
        return createImage(video.poster, video.ownerDocument);
      }
      return cloned;
    }
    return cloneCanvas(canvas, context);
  }
  return cloned;
}
function cloneElement(node, context) {
  if (isCanvasElement(node)) {
    return cloneCanvas(node, context);
  }
  if (isIFrameElement(node)) {
    return cloneIframe(node, context);
  }
  if (isImageElement(node)) {
    return cloneImage(node);
  }
  if (isVideoElement(node)) {
    return cloneVideo(node, context);
  }
  return node.cloneNode(false);
}
function getSandBox(context) {
  let sandbox = context.sandbox;
  if (!sandbox) {
    const { ownerDocument } = context;
    try {
      if (ownerDocument) {
        sandbox = ownerDocument.createElement("iframe");
        sandbox.id = `__SANDBOX__${uuid()}`;
        sandbox.width = "0";
        sandbox.height = "0";
        sandbox.style.visibility = "hidden";
        sandbox.style.position = "fixed";
        ownerDocument.body.appendChild(sandbox);
        sandbox.srcdoc = '<!DOCTYPE html><meta charset="UTF-8"><title></title><body>';
        context.sandbox = sandbox;
      }
    } catch (error) {
      context.log.warn("Failed to getSandBox", error);
    }
  }
  return sandbox;
}
function getDefaultStyle(node, pseudoElement, context) {
  const { defaultComputedStyles } = context;
  const nodeName = node.nodeName.toLowerCase();
  const isSvgNode = isSVGElementNode(node) && nodeName !== "svg";
  const attributes = isSvgNode ? includedAttributes.map((name) => [name, node.getAttribute(name)]).filter(([, value]) => value !== null) : [];
  const key = [
    isSvgNode && "svg",
    nodeName,
    attributes.map((name, value) => `${name}=${value}`).join(","),
    pseudoElement
  ].filter(Boolean).join(":");
  if (defaultComputedStyles.has(key))
    return defaultComputedStyles.get(key);
  const sandbox = getSandBox(context);
  const sandboxWindow = sandbox?.contentWindow;
  if (!sandboxWindow)
    return /* @__PURE__ */ new Map();
  const sandboxDocument = sandboxWindow?.document;
  let root;
  let el;
  if (isSvgNode) {
    root = sandboxDocument.createElementNS(XMLNS, "svg");
    el = root.ownerDocument.createElementNS(root.namespaceURI, nodeName);
    attributes.forEach(([name, value]) => {
      el.setAttributeNS(null, name, value);
    });
    root.appendChild(el);
  } else {
    root = el = sandboxDocument.createElement(nodeName);
  }
  el.textContent = " ";
  sandboxDocument.body.appendChild(root);
  const computedStyle = sandboxWindow.getComputedStyle(el, pseudoElement);
  const styles = /* @__PURE__ */ new Map();
  for (let len = computedStyle.length, i = 0; i < len; i++) {
    const name = computedStyle.item(i);
    if (ignoredStyles.includes(name))
      continue;
    styles.set(name, computedStyle.getPropertyValue(name));
  }
  sandboxDocument.body.removeChild(root);
  defaultComputedStyles.set(key, styles);
  return styles;
}
function getDiffStyle(style, defaultStyle, includeStyleProperties) {
  const diffStyle = /* @__PURE__ */ new Map();
  const prefixs = [];
  const prefixTree = /* @__PURE__ */ new Map();
  if (includeStyleProperties) {
    for (const name of includeStyleProperties) {
      applyTo(name);
    }
  } else {
    for (let len = style.length, i = 0; i < len; i++) {
      const name = style.item(i);
      applyTo(name);
    }
  }
  for (let len = prefixs.length, i = 0; i < len; i++) {
    prefixTree.get(prefixs[i])?.forEach((value, name) => diffStyle.set(name, value));
  }
  function applyTo(name) {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    const subIndex = name.lastIndexOf("-");
    const prefix = subIndex > -1 ? name.substring(0, subIndex) : void 0;
    if (prefix) {
      let map = prefixTree.get(prefix);
      if (!map) {
        map = /* @__PURE__ */ new Map();
        prefixTree.set(prefix, map);
      }
      map.set(name, [value, priority]);
    }
    if (defaultStyle.get(name) === value && !priority)
      return;
    if (prefix) {
      prefixs.push(prefix);
    } else {
      diffStyle.set(name, [value, priority]);
    }
  }
  return diffStyle;
}
function copyCssStyles(node, cloned, isRoot, context) {
  const { ownerWindow, includeStyleProperties, currentParentNodeStyle } = context;
  const clonedStyle = cloned.style;
  const computedStyle = ownerWindow.getComputedStyle(node);
  const defaultStyle = getDefaultStyle(node, null, context);
  currentParentNodeStyle?.forEach((_, key) => {
    defaultStyle.delete(key);
  });
  const style = getDiffStyle(computedStyle, defaultStyle, includeStyleProperties);
  style.delete("transition-property");
  style.delete("all");
  style.delete("d");
  style.delete("content");
  if (isRoot) {
    style.delete("margin-top");
    style.delete("margin-right");
    style.delete("margin-bottom");
    style.delete("margin-left");
    style.delete("margin-block-start");
    style.delete("margin-block-end");
    style.delete("margin-inline-start");
    style.delete("margin-inline-end");
    style.set("box-sizing", ["border-box", ""]);
  }
  if (style.get("background-clip")?.[0] === "text") {
    cloned.classList.add("______background-clip--text");
  }
  if (IN_CHROME) {
    if (!style.has("font-kerning"))
      style.set("font-kerning", ["normal", ""]);
    if ((style.get("overflow-x")?.[0] === "hidden" || style.get("overflow-y")?.[0] === "hidden") && style.get("text-overflow")?.[0] === "ellipsis" && node.scrollWidth === node.clientWidth) {
      style.set("text-overflow", ["clip", ""]);
    }
  }
  for (let len = clonedStyle.length, i = 0; i < len; i++) {
    clonedStyle.removeProperty(clonedStyle.item(i));
  }
  style.forEach(([value, priority], name) => {
    clonedStyle.setProperty(name, value, priority);
  });
  return style;
}
function copyInputValue(node, cloned) {
  if (isTextareaElement(node) || isInputElement(node) || isSelectElement(node)) {
    cloned.setAttribute("value", node.value);
  }
}
function copyPseudoClass(node, cloned, copyScrollbar, context, addWordToFontFamilies) {
  const { ownerWindow, svgStyleElement, svgStyles, currentNodeStyle } = context;
  if (!svgStyleElement || !ownerWindow)
    return;
  function copyBy(pseudoClass) {
    const computedStyle = ownerWindow.getComputedStyle(node, pseudoClass);
    let content = computedStyle.getPropertyValue("content");
    if (!content || content === "none")
      return;
    addWordToFontFamilies?.(content);
    content = content.replace(/(')|(")|(counter\(.+\))/g, "");
    const klasses = [uuid()];
    const defaultStyle = getDefaultStyle(node, pseudoClass, context);
    currentNodeStyle?.forEach((_, key) => {
      defaultStyle.delete(key);
    });
    const style = getDiffStyle(computedStyle, defaultStyle, context.includeStyleProperties);
    style.delete("content");
    style.delete("-webkit-locale");
    if (style.get("background-clip")?.[0] === "text") {
      cloned.classList.add("______background-clip--text");
    }
    const cloneStyle = [
      `content: '${content}';`
    ];
    style.forEach(([value, priority], name) => {
      cloneStyle.push(`${name}: ${value}${priority ? " !important" : ""};`);
    });
    if (cloneStyle.length === 1)
      return;
    try {
      cloned.className = [cloned.className, ...klasses].join(" ");
    } catch (err) {
      context.log.warn("Failed to copyPseudoClass", err);
      return;
    }
    const cssText = cloneStyle.join("\n  ");
    let allClasses = svgStyles.get(cssText);
    if (!allClasses) {
      allClasses = [];
      svgStyles.set(cssText, allClasses);
    }
    allClasses.push(`.${klasses[0]}${pseudoClass}`);
  }
  pseudoClasses.forEach(copyBy);
  if (copyScrollbar)
    scrollbarPseudoClasses.forEach(copyBy);
}
async function appendChildNode(node, cloned, child, context, addWordToFontFamilies) {
  if (isElementNode(child) && (isStyleElement(child) || isScriptElement(child)))
    return;
  if (context.filter && !context.filter(child))
    return;
  if (excludeParentNodes.has(cloned.nodeName) || excludeParentNodes.has(child.nodeName)) {
    context.currentParentNodeStyle = void 0;
  } else {
    context.currentParentNodeStyle = context.currentNodeStyle;
  }
  const childCloned = await cloneNode(child, context, false, addWordToFontFamilies);
  if (context.isEnable("restoreScrollPosition")) {
    restoreScrollPosition(node, childCloned);
  }
  cloned.appendChild(childCloned);
}
async function cloneChildNodes(node, cloned, context, addWordToFontFamilies) {
  let firstChild = node.firstChild;
  if (isElementNode(node)) {
    if (node.shadowRoot) {
      firstChild = node.shadowRoot?.firstChild;
      context.shadowRoots.push(node.shadowRoot);
    }
  }
  for (let child = firstChild; child; child = child.nextSibling) {
    if (isCommentNode(child))
      continue;
    if (isElementNode(child) && isSlotElement(child) && typeof child.assignedNodes === "function") {
      const nodes = child.assignedNodes();
      for (let i = 0; i < nodes.length; i++) {
        await appendChildNode(node, cloned, nodes[i], context, addWordToFontFamilies);
      }
    } else {
      await appendChildNode(node, cloned, child, context, addWordToFontFamilies);
    }
  }
}
function restoreScrollPosition(node, chlidCloned) {
  if (!isHTMLElementNode(node) || !isHTMLElementNode(chlidCloned))
    return;
  const { scrollTop, scrollLeft } = node;
  if (!scrollTop && !scrollLeft) {
    return;
  }
  const { transform } = chlidCloned.style;
  const matrix = new DOMMatrix(transform);
  const { a, b, c, d } = matrix;
  matrix.a = 1;
  matrix.b = 0;
  matrix.c = 0;
  matrix.d = 1;
  matrix.translateSelf(-scrollLeft, -scrollTop);
  matrix.a = a;
  matrix.b = b;
  matrix.c = c;
  matrix.d = d;
  chlidCloned.style.transform = matrix.toString();
}
function applyCssStyleWithOptions(cloned, context) {
  const { backgroundColor, width, height, style: styles } = context;
  const clonedStyle = cloned.style;
  if (backgroundColor)
    clonedStyle.setProperty("background-color", backgroundColor, "important");
  if (width)
    clonedStyle.setProperty("width", `${width}px`, "important");
  if (height)
    clonedStyle.setProperty("height", `${height}px`, "important");
  if (styles) {
    for (const name in styles) clonedStyle[name] = styles[name];
  }
}
async function cloneNode(node, context, isRoot = false, addWordToFontFamilies) {
  const { ownerDocument, ownerWindow, fontFamilies, onCloneEachNode } = context;
  if (ownerDocument && isTextNode(node)) {
    if (addWordToFontFamilies && /\S/.test(node.data)) {
      addWordToFontFamilies(node.data);
    }
    return ownerDocument.createTextNode(node.data);
  }
  if (ownerDocument && ownerWindow && isElementNode(node) && (isHTMLElementNode(node) || isSVGElementNode(node))) {
    const cloned2 = await cloneElement(node, context);
    if (context.isEnable("removeAbnormalAttributes")) {
      const names = cloned2.getAttributeNames();
      for (let len = names.length, i = 0; i < len; i++) {
        const name = names[i];
        if (!NORMAL_ATTRIBUTE_RE.test(name)) {
          cloned2.removeAttribute(name);
        }
      }
    }
    const style = context.currentNodeStyle = copyCssStyles(node, cloned2, isRoot, context);
    if (isRoot)
      applyCssStyleWithOptions(cloned2, context);
    let copyScrollbar = false;
    if (context.isEnable("copyScrollbar")) {
      const overflow = [
        style.get("overflow-x")?.[0],
        style.get("overflow-y")?.[0]
      ];
      copyScrollbar = overflow.includes("scroll") || (overflow.includes("auto") || overflow.includes("overlay")) && (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth);
    }
    const textTransform = style.get("text-transform")?.[0];
    const families = splitFontFamily(style.get("font-family")?.[0]);
    const addWordToFontFamilies2 = families ? (word) => {
      if (textTransform === "uppercase") {
        word = word.toUpperCase();
      } else if (textTransform === "lowercase") {
        word = word.toLowerCase();
      } else if (textTransform === "capitalize") {
        word = word[0].toUpperCase() + word.substring(1);
      }
      families.forEach((family) => {
        let fontFamily = fontFamilies.get(family);
        if (!fontFamily) {
          fontFamilies.set(family, fontFamily = /* @__PURE__ */ new Set());
        }
        word.split("").forEach((text) => fontFamily.add(text));
      });
    } : void 0;
    copyPseudoClass(
      node,
      cloned2,
      copyScrollbar,
      context,
      addWordToFontFamilies2
    );
    copyInputValue(node, cloned2);
    if (!isVideoElement(node)) {
      await cloneChildNodes(
        node,
        cloned2,
        context,
        addWordToFontFamilies2
      );
    }
    await onCloneEachNode?.(cloned2);
    return cloned2;
  }
  const cloned = node.cloneNode(false);
  await cloneChildNodes(node, cloned, context);
  await onCloneEachNode?.(cloned);
  return cloned;
}
function destroyContext(context) {
  context.ownerDocument = void 0;
  context.ownerWindow = void 0;
  context.svgStyleElement = void 0;
  context.svgDefsElement = void 0;
  context.svgStyles.clear();
  context.defaultComputedStyles.clear();
  if (context.sandbox) {
    try {
      context.sandbox.remove();
    } catch (err) {
      context.log.warn("Failed to destroyContext", err);
    }
    context.sandbox = void 0;
  }
  context.workers = [];
  context.fontFamilies.clear();
  context.fontCssTexts.clear();
  context.requests.clear();
  context.tasks = [];
  context.shadowRoots = [];
}
function baseFetch(options) {
  const { url, timeout, responseType, ...requestInit } = options;
  const controller = new AbortController();
  const timer = timeout ? setTimeout(() => controller.abort(), timeout) : void 0;
  return fetch(url, { signal: controller.signal, ...requestInit }).then((response) => {
    if (!response.ok) {
      throw new Error("Failed fetch, not 2xx response", { cause: response });
    }
    switch (responseType) {
      case "arrayBuffer":
        return response.arrayBuffer();
      case "dataUrl":
        return response.blob().then(blobToDataUrl);
      case "text":
      default:
        return response.text();
    }
  }).finally(() => clearTimeout(timer));
}
function contextFetch(context, options) {
  const { url: rawUrl, requestType = "text", responseType = "text", imageDom } = options;
  let url = rawUrl;
  const {
    timeout,
    acceptOfImage,
    requests,
    fetchFn,
    fetch: {
      requestInit,
      bypassingCache,
      placeholderImage
    },
    font,
    workers,
    fontFamilies
  } = context;
  if (requestType === "image" && (IN_SAFARI || IN_FIREFOX)) {
    context.drawImageCount++;
  }
  let request = requests.get(rawUrl);
  if (!request) {
    if (bypassingCache) {
      if (bypassingCache instanceof RegExp && bypassingCache.test(url)) {
        url += (/\?/.test(url) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
      }
    }
    const canFontMinify = requestType.startsWith("font") && font && font.minify;
    const fontTexts = /* @__PURE__ */ new Set();
    if (canFontMinify) {
      const families = requestType.split(";")[1].split(",");
      families.forEach((family) => {
        if (!fontFamilies.has(family))
          return;
        fontFamilies.get(family).forEach((text) => fontTexts.add(text));
      });
    }
    const needFontMinify = canFontMinify && fontTexts.size;
    const baseFetchOptions = {
      url,
      timeout,
      responseType: needFontMinify ? "arrayBuffer" : responseType,
      headers: requestType === "image" ? { accept: acceptOfImage } : void 0,
      ...requestInit
    };
    request = {
      type: requestType,
      resolve: void 0,
      reject: void 0,
      response: null
    };
    request.response = (async () => {
      if (fetchFn && requestType === "image") {
        const result = await fetchFn(rawUrl);
        if (result)
          return result;
      }
      if (!IN_SAFARI && rawUrl.startsWith("http") && workers.length) {
        return new Promise((resolve, reject) => {
          const worker = workers[requests.size & workers.length - 1];
          worker.postMessage({ rawUrl, ...baseFetchOptions });
          request.resolve = resolve;
          request.reject = reject;
        });
      }
      return baseFetch(baseFetchOptions);
    })().catch((error) => {
      requests.delete(rawUrl);
      if (requestType === "image" && placeholderImage) {
        context.log.warn("Failed to fetch image base64, trying to use placeholder image", url);
        return typeof placeholderImage === "string" ? placeholderImage : placeholderImage(imageDom);
      }
      throw error;
    });
    requests.set(rawUrl, request);
  }
  return request.response;
}
async function replaceCssUrlToDataUrl(cssText, baseUrl, context, isImage) {
  if (!hasCssUrl(cssText))
    return cssText;
  for (const [rawUrl, url] of parseCssUrls(cssText, baseUrl)) {
    try {
      const dataUrl = await contextFetch(
        context,
        {
          url,
          requestType: isImage ? "image" : "text",
          responseType: "dataUrl"
        }
      );
      cssText = cssText.replace(toRE(rawUrl), `$1${dataUrl}$3`);
    } catch (error) {
      context.log.warn("Failed to fetch css data url", rawUrl, error);
    }
  }
  return cssText;
}
function hasCssUrl(cssText) {
  return /url\((['"]?)([^'"]+?)\1\)/.test(cssText);
}
function parseCssUrls(cssText, baseUrl) {
  const result = [];
  cssText.replace(URL_RE, (raw, quotation, url) => {
    result.push([url, resolveUrl(url, baseUrl)]);
    return raw;
  });
  return result.filter(([url]) => !isDataUrl(url));
}
function toRE(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function embedCssStyleImage(style, context) {
  return properties.map((property) => {
    const value = style.getPropertyValue(property);
    if (!value || value === "none") {
      return null;
    }
    if (IN_SAFARI || IN_FIREFOX) {
      context.drawImageCount++;
    }
    return replaceCssUrlToDataUrl(value, null, context, true).then((newValue) => {
      if (!newValue || value === newValue)
        return;
      style.setProperty(
        property,
        newValue,
        style.getPropertyPriority(property)
      );
    });
  }).filter(Boolean);
}
function embedImageElement(cloned, context) {
  if (isImageElement(cloned)) {
    const originalSrc = cloned.currentSrc || cloned.src;
    if (!isDataUrl(originalSrc)) {
      return [
        contextFetch(context, {
          url: originalSrc,
          imageDom: cloned,
          requestType: "image",
          responseType: "dataUrl"
        }).then((url) => {
          if (!url)
            return;
          cloned.srcset = "";
          cloned.dataset.originalSrc = originalSrc;
          cloned.src = url || "";
        })
      ];
    }
    if (IN_SAFARI || IN_FIREFOX) {
      context.drawImageCount++;
    }
  } else if (isSVGElementNode(cloned) && !isDataUrl(cloned.href.baseVal)) {
    const originalSrc = cloned.href.baseVal;
    return [
      contextFetch(context, {
        url: originalSrc,
        imageDom: cloned,
        requestType: "image",
        responseType: "dataUrl"
      }).then((url) => {
        if (!url)
          return;
        cloned.dataset.originalSrc = originalSrc;
        cloned.href.baseVal = url || "";
      })
    ];
  }
  return [];
}
function embedSvgUse(cloned, context) {
  const { ownerDocument, svgDefsElement } = context;
  const href = cloned.getAttribute("href") ?? cloned.getAttribute("xlink:href");
  if (!href)
    return [];
  const [svgUrl, id] = href.split("#");
  if (id) {
    const query = `#${id}`;
    const definition = context.shadowRoots.reduce(
      (res, root) => {
        return res ?? root.querySelector(`svg ${query}`);
      },
      ownerDocument?.querySelector(`svg ${query}`)
    );
    if (svgUrl) {
      cloned.setAttribute("href", query);
    }
    if (svgDefsElement?.querySelector(query))
      return [];
    if (definition) {
      svgDefsElement?.appendChild(definition.cloneNode(true));
      return [];
    } else if (svgUrl) {
      return [
        contextFetch(context, {
          url: svgUrl,
          responseType: "text"
        }).then((svgData) => {
          svgDefsElement?.insertAdjacentHTML("beforeend", svgData);
        })
      ];
    }
  }
  return [];
}
function embedNode(cloned, context) {
  const { tasks } = context;
  if (isElementNode(cloned)) {
    if (isImageElement(cloned) || isSVGImageElementNode(cloned)) {
      tasks.push(...embedImageElement(cloned, context));
    }
    if (isSVGUseElementNode(cloned)) {
      tasks.push(...embedSvgUse(cloned, context));
    }
  }
  if (isHTMLElementNode(cloned)) {
    tasks.push(...embedCssStyleImage(cloned.style, context));
  }
  cloned.childNodes.forEach((child) => {
    embedNode(child, context);
  });
}
async function embedWebFont(clone, context) {
  const {
    ownerDocument,
    svgStyleElement,
    fontFamilies,
    fontCssTexts,
    tasks,
    font
  } = context;
  if (!ownerDocument || !svgStyleElement || !fontFamilies.size) {
    return;
  }
  if (font && font.cssText) {
    const cssText = filterPreferredFormat(font.cssText, context);
    svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText}
`));
  } else {
    const styleSheets = Array.from(ownerDocument.styleSheets).filter((styleSheet) => {
      try {
        return "cssRules" in styleSheet && Boolean(styleSheet.cssRules.length);
      } catch (error) {
        context.log.warn(`Error while reading CSS rules from ${styleSheet.href}`, error);
        return false;
      }
    });
    await Promise.all(
      styleSheets.flatMap((styleSheet) => {
        return Array.from(styleSheet.cssRules).map(async (cssRule, index) => {
          if (isCSSImportRule(cssRule)) {
            let importIndex = index + 1;
            const baseUrl = cssRule.href;
            let cssText = "";
            try {
              cssText = await contextFetch(context, {
                url: baseUrl,
                requestType: "text",
                responseType: "text"
              });
            } catch (error) {
              context.log.warn(`Error fetch remote css import from ${baseUrl}`, error);
            }
            const replacedCssText = cssText.replace(
              URL_RE,
              (raw, quotation, url) => raw.replace(url, resolveUrl(url, baseUrl))
            );
            for (const rule of parseCss(replacedCssText)) {
              try {
                styleSheet.insertRule(
                  rule,
                  rule.startsWith("@import") ? importIndex += 1 : styleSheet.cssRules.length
                );
              } catch (error) {
                context.log.warn("Error inserting rule from remote css import", { rule, error });
              }
            }
          }
        });
      })
    );
    const cssRules = [];
    styleSheets.forEach((sheet) => {
      unwrapCssLayers(sheet.cssRules, cssRules);
    });
    cssRules.filter((cssRule) => isCssFontFaceRule(cssRule) && hasCssUrl(cssRule.style.getPropertyValue("src")) && splitFontFamily(cssRule.style.getPropertyValue("font-family"))?.some((val) => fontFamilies.has(val))).forEach((value) => {
      const rule = value;
      const cssText = fontCssTexts.get(rule.cssText);
      if (cssText) {
        svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText}
`));
      } else {
        tasks.push(
          replaceCssUrlToDataUrl(
            rule.cssText,
            rule.parentStyleSheet ? rule.parentStyleSheet.href : null,
            context
          ).then((cssText2) => {
            cssText2 = filterPreferredFormat(cssText2, context);
            fontCssTexts.set(rule.cssText, cssText2);
            svgStyleElement.appendChild(ownerDocument.createTextNode(`${cssText2}
`));
          })
        );
      }
    });
  }
}
function parseCss(source) {
  if (source == null)
    return [];
  const result = [];
  let cssText = source.replace(COMMENTS_RE, "");
  while (true) {
    const matches = KEYFRAMES_RE.exec(cssText);
    if (!matches)
      break;
    result.push(matches[0]);
  }
  cssText = cssText.replace(KEYFRAMES_RE, "");
  const IMPORT_RE = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const UNIFIED_RE = new RegExp(
    // eslint-disable-next-line
    "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})",
    "gi"
  );
  while (true) {
    let matches = IMPORT_RE.exec(cssText);
    if (!matches) {
      matches = UNIFIED_RE.exec(cssText);
      if (!matches) {
        break;
      } else {
        IMPORT_RE.lastIndex = UNIFIED_RE.lastIndex;
      }
    } else {
      UNIFIED_RE.lastIndex = IMPORT_RE.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
function filterPreferredFormat(str, context) {
  const { font } = context;
  const preferredFormat = font ? font?.preferredFormat : void 0;
  return preferredFormat ? str.replace(FONT_SRC_RE, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_RE.exec(match) || [];
      if (!format)
        return "";
      if (format === preferredFormat)
        return `src: ${src};`;
    }
  }) : str;
}
function unwrapCssLayers(rules, out = []) {
  for (const rule of Array.from(rules)) {
    if (isLayerBlockRule(rule)) {
      out.push(...unwrapCssLayers(rule.cssRules));
    } else if ("cssRules" in rule) {
      unwrapCssLayers(rule.cssRules, out);
    } else {
      out.push(rule);
    }
  }
  return out;
}
async function domToForeignObjectSvg(node, options) {
  const context = await orCreateContext(node, options);
  if (isElementNode(context.node) && isSVGElementNode(context.node))
    return context.node;
  const {
    ownerDocument,
    log,
    tasks,
    svgStyleElement,
    svgDefsElement,
    svgStyles,
    font,
    progress,
    autoDestruct,
    onCloneNode,
    onEmbedNode,
    onCreateForeignObjectSvg
  } = context;
  log.time("clone node");
  const clone = await cloneNode(context.node, context, true);
  if (svgStyleElement && ownerDocument) {
    let allCssText = "";
    svgStyles.forEach((klasses, cssText) => {
      allCssText += `${klasses.join(",\n")} {
  ${cssText}
}
`;
    });
    svgStyleElement.appendChild(ownerDocument.createTextNode(allCssText));
  }
  log.timeEnd("clone node");
  await onCloneNode?.(clone);
  if (font !== false && isElementNode(clone)) {
    log.time("embed web font");
    await embedWebFont(clone, context);
    log.timeEnd("embed web font");
  }
  log.time("embed node");
  embedNode(clone, context);
  const count = tasks.length;
  let current = 0;
  const runTask = async () => {
    while (true) {
      const task = tasks.pop();
      if (!task)
        break;
      try {
        await task;
      } catch (error) {
        context.log.warn("Failed to run task", error);
      }
      progress?.(++current, count);
    }
  };
  progress?.(current, count);
  await Promise.all([...Array.from({ length: 4 })].map(runTask));
  log.timeEnd("embed node");
  await onEmbedNode?.(clone);
  const svg = createForeignObjectSvg(clone, context);
  svgDefsElement && svg.insertBefore(svgDefsElement, svg.children[0]);
  svgStyleElement && svg.insertBefore(svgStyleElement, svg.children[0]);
  autoDestruct && destroyContext(context);
  await onCreateForeignObjectSvg?.(svg);
  return svg;
}
function createForeignObjectSvg(clone, context) {
  const { width, height } = context;
  const svg = createSvg(width, height, clone.ownerDocument);
  const foreignObject = svg.ownerDocument.createElementNS(svg.namespaceURI, "foreignObject");
  foreignObject.setAttributeNS(null, "x", "0%");
  foreignObject.setAttributeNS(null, "y", "0%");
  foreignObject.setAttributeNS(null, "width", "100%");
  foreignObject.setAttributeNS(null, "height", "100%");
  foreignObject.append(clone);
  svg.appendChild(foreignObject);
  return svg;
}
async function domToCanvas(node, options) {
  const context = await orCreateContext(node, options);
  const svg = await domToForeignObjectSvg(context);
  const dataUrl = svgToDataUrl(svg, context.isEnable("removeControlCharacter"));
  if (!context.autoDestruct) {
    context.svgStyleElement = createStyleElement(context.ownerDocument);
    context.svgDefsElement = context.ownerDocument?.createElementNS(XMLNS, "defs");
    context.svgStyles.clear();
  }
  const image = createImage(dataUrl, svg.ownerDocument);
  return await imageToCanvas(image, context);
}
async function domToBlob(node, options) {
  const context = await orCreateContext(node, options);
  const { log, type, quality, dpi } = context;
  const canvas = await domToCanvas(context);
  log.time("canvas to blob");
  const blob = await canvasToBlob(canvas, type, quality);
  if (["image/png", "image/jpeg"].includes(type) && dpi) {
    const arrayBuffer = await blobToArrayBuffer(blob.slice(0, 33));
    let uint8Array = new Uint8Array(arrayBuffer);
    if (type === "image/png") {
      uint8Array = changePngDpi(uint8Array, dpi);
    } else if (type === "image/jpeg") {
      uint8Array = changeJpegDpi(uint8Array, dpi);
    }
    log.timeEnd("canvas to blob");
    return new Blob([uint8Array, blob.slice(33)], { type });
  }
  log.timeEnd("canvas to blob");
  return blob;
}
async function domToDataUrl(node, options) {
  const context = await orCreateContext(node, options);
  const { log, quality, type, dpi } = context;
  const canvas = await domToCanvas(context);
  log.time("canvas to data url");
  let dataUrl = canvas.toDataURL(type, quality);
  if (["image/png", "image/jpeg"].includes(type) && dpi && SUPPORT_ATOB && SUPPORT_BTOA) {
    const [format, body] = dataUrl.split(",");
    let headerLength = 0;
    let overwritepHYs = false;
    if (type === "image/png") {
      const b64Index = detectPhysChunkFromDataUrl(body);
      if (b64Index >= 0) {
        headerLength = Math.ceil((b64Index + 28) / 3) * 4;
        overwritepHYs = true;
      } else {
        headerLength = 33 / 3 * 4;
      }
    } else if (type === "image/jpeg") {
      headerLength = 18 / 3 * 4;
    }
    const stringHeader = body.substring(0, headerLength);
    const restOfData = body.substring(headerLength);
    const headerBytes = window.atob(stringHeader);
    const uint8Array = new Uint8Array(headerBytes.length);
    for (let i = 0; i < uint8Array.length; i++) {
      uint8Array[i] = headerBytes.charCodeAt(i);
    }
    const finalArray = type === "image/png" ? changePngDpi(uint8Array, dpi, overwritepHYs) : changeJpegDpi(uint8Array, dpi);
    const base64Header = window.btoa(String.fromCharCode(...finalArray));
    dataUrl = [format, ",", base64Header, restOfData].join("");
  }
  log.timeEnd("canvas to data url");
  return dataUrl;
}
async function domToSvg(node, options) {
  const context = await orCreateContext(node, options);
  const { width, height, ownerDocument } = context;
  const dataUrl = await domToDataUrl(context);
  const svg = createSvg(width, height, ownerDocument);
  const svgImage = svg.ownerDocument.createElementNS(svg.namespaceURI, "image");
  svgImage.setAttributeNS(null, "href", dataUrl);
  svgImage.setAttributeNS(null, "height", "100%");
  svgImage.setAttributeNS(null, "width", "100%");
  svg.appendChild(svgImage);
  return svgToDataUrl(svg, context.isEnable("removeControlCharacter"));
}
async function domToImage(node, options) {
  const context = await orCreateContext(node, options);
  const { ownerDocument, width, height, scale, type } = context;
  const url = type === "image/svg+xml" ? await domToSvg(context) : await domToDataUrl(context);
  const image = createImage(url, ownerDocument);
  image.width = Math.floor(width * scale);
  image.height = Math.floor(height * scale);
  image.style.width = `${width}px`;
  image.style.height = `${height}px`;
  return image;
}
async function domToJpeg(node, options) {
  return domToDataUrl(
    await orCreateContext(node, { ...options, type: "image/jpeg" })
  );
}
async function domToPixel(node, options) {
  const context = await orCreateContext(node, options);
  const canvas = await domToCanvas(context);
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
}
async function domToPng(node, options) {
  return domToDataUrl(
    await orCreateContext(node, { ...options, type: "image/png" })
  );
}
async function domToWebp(node, options) {
  return domToDataUrl(
    await orCreateContext(node, { ...options, type: "image/webp" })
  );
}
var _P, _H, _Y, _S, pngDataTable, b64PhysSignature1, b64PhysSignature2, b64PhysSignature3, PREFIX, IN_BROWSER, SUPPORT_WEB_WORKER, SUPPORT_ATOB, SUPPORT_BTOA, USER_AGENT, IN_CHROME, IN_SAFARI, IN_FIREFOX, isContext, isCssFontFaceRule, isCSSImportRule, isLayerBlockRule, isElementNode, isSVGElementNode, isSVGImageElementNode, isSVGUseElementNode, isHTMLElementNode, isCommentNode, isTextNode, isImageElement, isVideoElement, isCanvasElement, isTextareaElement, isInputElement, isStyleElement, isScriptElement, isSelectElement, isSlotElement, isIFrameElement, consoleWarn, isDataUrl, XMLNS, blobToDataUrl, blobToArrayBuffer, uuid, uid, ignoredStyles, includedAttributes, pseudoClasses, scrollbarPseudoClasses, excludeParentNodes, NORMAL_ATTRIBUTE_RE, URL_RE, properties, COMMENTS_RE, KEYFRAMES_RE, URL_WITH_FORMAT_RE, FONT_SRC_RE;
var init_dist = __esm({
  "../../node_modules/.pnpm/modern-screenshot@4.6.8/node_modules/modern-screenshot/dist/index.mjs"() {
    "use strict";
    _P = "p".charCodeAt(0);
    _H = "H".charCodeAt(0);
    _Y = "Y".charCodeAt(0);
    _S = "s".charCodeAt(0);
    b64PhysSignature1 = "AAlwSFlz";
    b64PhysSignature2 = "AAAJcEhZ";
    b64PhysSignature3 = "AAAACXBI";
    PREFIX = "[modern-screenshot]";
    IN_BROWSER = typeof window !== "undefined";
    SUPPORT_WEB_WORKER = IN_BROWSER && "Worker" in window;
    SUPPORT_ATOB = IN_BROWSER && "atob" in window;
    SUPPORT_BTOA = IN_BROWSER && "btoa" in window;
    USER_AGENT = IN_BROWSER ? window.navigator?.userAgent : "";
    IN_CHROME = USER_AGENT.includes("Chrome");
    IN_SAFARI = USER_AGENT.includes("AppleWebKit") && !IN_CHROME;
    IN_FIREFOX = USER_AGENT.includes("Firefox");
    isContext = (value) => value && "__CONTEXT__" in value;
    isCssFontFaceRule = (rule) => rule.constructor.name === "CSSFontFaceRule";
    isCSSImportRule = (rule) => rule.constructor.name === "CSSImportRule";
    isLayerBlockRule = (rule) => rule.constructor.name === "CSSLayerBlockRule";
    isElementNode = (node) => node.nodeType === 1;
    isSVGElementNode = (node) => typeof node.className === "object";
    isSVGImageElementNode = (node) => node.tagName === "image";
    isSVGUseElementNode = (node) => node.tagName === "use";
    isHTMLElementNode = (node) => isElementNode(node) && typeof node.style !== "undefined" && !isSVGElementNode(node);
    isCommentNode = (node) => node.nodeType === 8;
    isTextNode = (node) => node.nodeType === 3;
    isImageElement = (node) => node.tagName === "IMG";
    isVideoElement = (node) => node.tagName === "VIDEO";
    isCanvasElement = (node) => node.tagName === "CANVAS";
    isTextareaElement = (node) => node.tagName === "TEXTAREA";
    isInputElement = (node) => node.tagName === "INPUT";
    isStyleElement = (node) => node.tagName === "STYLE";
    isScriptElement = (node) => node.tagName === "SCRIPT";
    isSelectElement = (node) => node.tagName === "SELECT";
    isSlotElement = (node) => node.tagName === "SLOT";
    isIFrameElement = (node) => node.tagName === "IFRAME";
    consoleWarn = (...args) => console.warn(PREFIX, ...args);
    isDataUrl = (url) => url.startsWith("data:");
    XMLNS = "http://www.w3.org/2000/svg";
    blobToDataUrl = (blob) => readBlob(blob, "dataUrl");
    blobToArrayBuffer = (blob) => readBlob(blob, "arrayBuffer");
    uuid = /* @__PURE__ */ (function uuid2() {
      let counter = 0;
      const random = () => `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4);
      return () => {
        counter += 1;
        return `u${random()}${counter}`;
      };
    })();
    uid = 0;
    ignoredStyles = [
      "width",
      "height",
      "-webkit-text-fill-color"
    ];
    includedAttributes = [
      "stroke",
      "fill"
    ];
    pseudoClasses = [
      "::before",
      "::after"
      // '::placeholder', TODO
    ];
    scrollbarPseudoClasses = [
      "::-webkit-scrollbar",
      "::-webkit-scrollbar-button",
      // '::-webkit-scrollbar:horizontal', TODO
      "::-webkit-scrollbar-thumb",
      "::-webkit-scrollbar-track",
      "::-webkit-scrollbar-track-piece",
      // '::-webkit-scrollbar:vertical', TODO
      "::-webkit-scrollbar-corner",
      "::-webkit-resizer"
    ];
    excludeParentNodes = /* @__PURE__ */ new Set([
      "symbol"
      // test/fixtures/svg.symbol.html
    ]);
    NORMAL_ATTRIBUTE_RE = /^[\w-:]+$/;
    URL_RE = /url\((['"]?)([^'"]+?)\1\)/g;
    properties = [
      "background-image",
      "border-image-source",
      "-webkit-border-image",
      "-webkit-mask-image",
      "list-style-image"
    ];
    COMMENTS_RE = /(\/\*[\s\S]*?\*\/)/g;
    KEYFRAMES_RE = /((@.*?keyframes [\s\S]*?){([\s\S]*?}\s*?)})/gi;
    URL_WITH_FORMAT_RE = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
    FONT_SRC_RE = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
  }
});

// ../core/src/capture.ts
async function captureScreenshot(opts = {}) {
  const { domToBlob: domToBlob2 } = await Promise.resolve().then(() => (init_dist(), dist_exports));
  const { panelEl } = opts;
  const pagePromise = domToBlob2(document.documentElement, {
    quality: 0.9,
    type: "image/png",
    timeout: 1e4,
    filter: panelEl ? (node) => node !== panelEl : void 0
  });
  if (!panelEl) {
    const page2 = await pagePromise;
    if (!page2) throw new Error("Screenshot capture returned empty blob");
    return { page: page2 };
  }
  const panelPromise = domToBlob2(panelEl, {
    quality: 0.9,
    type: "image/png",
    timeout: 1e4
  });
  const [pageResult, panelResult] = await Promise.allSettled([pagePromise, panelPromise]);
  const page = pageResult.status === "fulfilled" ? pageResult.value : null;
  const panel = panelResult.status === "fulfilled" ? panelResult.value : null;
  if (!page && !panel) {
    throw new Error("Screenshot capture: both page and panel captures failed");
  }
  return {
    page: page ?? panel,
    panel: panel ?? void 0
  };
}
function blobToDataUrl2(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
var init_capture = __esm({
  "../core/src/capture.ts"() {
    "use strict";
  }
});

// ../core/src/voice.ts
var VoiceInput;
var init_voice = __esm({
  "../core/src/voice.ts"() {
    "use strict";
    VoiceInput = class _VoiceInput {
      constructor() {
        __publicField(this, "recognition", null);
        __publicField(this, "resolveStop", null);
        __publicField(this, "accumulated", "");
        __publicField(this, "onInterim", null);
      }
      static isSupported() {
        if (typeof window === "undefined") return false;
        const w = window;
        return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
      }
      start() {
        if (!_VoiceInput.isSupported()) {
          throw new Error("Web Speech API not supported in this browser");
        }
        const w = window;
        const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
        this.accumulated = "";
        this.recognition.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += t;
            } else {
              interim += t;
            }
          }
          if (final) this.accumulated += final;
          this.onInterim?.(this.accumulated + interim);
        };
        this.recognition.start();
      }
      stop() {
        return new Promise((resolve) => {
          this.resolveStop = resolve;
          if (this.recognition) {
            this.recognition.onend = () => {
              resolve(this.accumulated.trim());
              this.resolveStop = null;
            };
            this.recognition.stop();
          } else {
            resolve("");
          }
        });
      }
      abort() {
        this.recognition?.abort();
        this.resolveStop?.("");
        this.resolveStop = null;
        this.accumulated = "";
      }
    };
  }
});

// ../core/src/conversation.ts
function makeSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
var ConversationEngine;
var init_conversation = __esm({
  "../core/src/conversation.ts"() {
    "use strict";
    ConversationEngine = class {
      constructor(registry) {
        __publicField(this, "registry");
        __publicField(this, "metadata", null);
        __publicField(this, "client", null);
        __publicField(this, "context", null);
        __publicField(this, "savedSessions", []);
        __publicField(this, "currentSessionId", makeSessionId());
        __publicField(this, "currentModeId", null);
        __publicField(this, "state", {
          turns: [],
          phase: "greeting",
          questionIndex: 0
        });
        __publicField(this, "commentIssueBody");
        __publicField(this, "commentDraftBody");
        this.registry = registry;
      }
      setMetadata(metadata) {
        this.metadata = metadata;
      }
      setClient(client) {
        this.client = client;
      }
      setContext(context) {
        this.context = context;
      }
      setSelectedModelId(id) {
        this.state = { ...this.state, selectedModelId: id };
      }
      setSubmissionId(id) {
        this.state = { ...this.state, submissionId: id };
      }
      setScreenshotUrl(url) {
        this.state = { ...this.state, screenshotUrl: url };
      }
      addAttachment(ref) {
        this.state = {
          ...this.state,
          attachmentUrls: [...this.state.attachmentUrls ?? [], ref]
        };
      }
      async start(modeId) {
        const mode = this.registry.get(modeId);
        this.currentModeId = modeId;
        const greeting = {
          role: "assistant",
          content: `I'll help you submit feedback. ${mode.questions[0]?.text ?? "What would you like to report?"}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          kind: "scripted"
        };
        this.state = {
          ...this.state,
          turns: [greeting],
          phase: "questions",
          questionIndex: 0,
          mode: mode.mode ?? "scripted"
        };
        return greeting;
      }
      async respond(modeId, userText) {
        const mode = this.registry.get(modeId);
        const userTurn = {
          role: "user",
          content: userText,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          kind: "user"
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, userTurn]
        };
        if ((mode.mode ?? "scripted") === "agentic") {
          return this.respondAgentic(userText);
        }
        const nextIndex = this.state.questionIndex + 1;
        if (nextIndex < mode.questions.length) {
          const nextQuestion = mode.questions[nextIndex];
          const assistantTurn = {
            role: "assistant",
            content: nextQuestion.text,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            kind: "scripted"
          };
          this.state = {
            ...this.state,
            turns: [...this.state.turns, assistantTurn],
            questionIndex: nextIndex
          };
          return assistantTurn;
        }
        const previewTurn = {
          role: "assistant",
          content: "__preview__",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.state = {
          ...this.state,
          turns: [...this.state.turns, previewTurn],
          phase: "preview"
        };
        return previewTurn;
      }
      async respondAgentic(userText) {
        if (!this.client) throw new Error("ConversationEngine: client not set");
        if (!this.context) throw new Error("ConversationEngine: context not set");
        if (!this.metadata) throw new Error("ConversationEngine: metadata not set");
        const res = await this.client.nextTurn({
          submissionId: this.state.submissionId,
          userText,
          selectedModelId: this.state.selectedModelId,
          repo: this.context.repo,
          panelRepo: this.context.panelRepo,
          metadata: this.metadata,
          transcript: this.state.turns,
          screenshotUrl: this.state.screenshotUrl,
          attachmentUrls: this.state.attachmentUrls,
          navigationBreadcrumb: this.context.navigationBreadcrumb,
          componentHint: this.context.componentHint,
          githubLogin: this.context.githubLogin
        });
        if (res.submissionId) {
          this.state = { ...this.state, submissionId: res.submissionId };
        }
        this.state = { ...this.state, knownFacts: res.knownFacts };
        return this.applyToolCall(res.toolCall);
      }
      applyToolCall(toolCall) {
        const ts = (/* @__PURE__ */ new Date()).toISOString();
        switch (toolCall.type) {
          case "ask_follow_up": {
            const turn = {
              role: "assistant",
              content: toolCall.question,
              timestamp: ts,
              kind: "agent"
            };
            this.state = {
              ...this.state,
              turns: [...this.state.turns, turn],
              clarifyOptions: void 0
            };
            return turn;
          }
          case "clarify_intent": {
            const turn = {
              role: "assistant",
              content: toolCall.question,
              timestamp: ts,
              kind: "clarify"
            };
            this.state = {
              ...this.state,
              turns: [...this.state.turns, turn],
              clarifyOptions: toolCall.options
            };
            return turn;
          }
          case "refuse_off_topic": {
            const turn = {
              role: "assistant",
              content: toolCall.redirect,
              timestamp: ts,
              kind: "redirect"
            };
            this.state = {
              ...this.state,
              turns: [...this.state.turns, turn],
              clarifyOptions: void 0
            };
            return turn;
          }
          case "draft_issue":
          case "revise_draft": {
            const turn = {
              role: "assistant",
              content: "__draft__",
              timestamp: ts,
              kind: "draft"
            };
            this.state = {
              ...this.state,
              turns: [...this.state.turns, turn],
              phase: "drafting",
              draft: toolCall.draft,
              clarifyOptions: void 0
            };
            return turn;
          }
        }
      }
      updateDraft(draft) {
        this.state = { ...this.state, draft };
      }
      async patchDraft(draft) {
        if (!this.client) throw new Error("ConversationEngine: client not set");
        if (!this.state.submissionId) throw new Error("ConversationEngine: no submissionId to patch");
        await this.client.patchDraft(this.state.submissionId, draft);
        this.updateDraft(draft);
      }
      getKnownFacts() {
        return this.state.knownFacts;
      }
      getPreview() {
        if (this.state.phase !== "preview") return null;
        const userAnswers = this.state.turns.filter((t) => t.role === "user").map((t) => t.content).join(" ");
        return {
          plainSummary: userAnswers.slice(0, 200),
          technicalDetails: this.metadata ? `**URL:** ${this.metadata.url}
**Browser:** ${this.metadata.userAgent}
**Viewport:** ${this.metadata.viewport.width}\xD7${this.metadata.viewport.height}` : "",
          screenshotUrl: this.state.screenshotUrl,
          attachmentUrls: this.state.attachmentUrls
        };
      }
      markSubmitted(issueUrl, issueNumber) {
        this.state = {
          ...this.state,
          phase: "submitted",
          issueUrl: issueUrl ?? this.state.issueUrl,
          issueNumber: issueNumber ?? this.state.issueNumber
        };
      }
      async startCommentSession(issueNumber, issueUrl, issueBody) {
        this.state = {
          ...this.state,
          phase: "commenting",
          issueNumber,
          issueUrl,
          turns: [
            {
              role: "assistant",
              content: `Let's draft a follow-up comment for issue #${issueNumber}. What would you like to add or change?`,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              kind: "agent"
            }
          ],
          knownFacts: {},
          draft: void 0,
          clarifyOptions: void 0
        };
        this.commentIssueBody = issueBody;
        this.commentDraftBody = void 0;
      }
      getCommentDraftBody() {
        return this.commentDraftBody;
      }
      async respondToComment(userText) {
        if (!this.client) throw new Error("ConversationEngine: client not set");
        if (!this.context) throw new Error("ConversationEngine: context not set");
        const submissionId = this.state.submissionId;
        const issueNumber = this.state.issueNumber;
        const issueUrl = this.state.issueUrl;
        if (!submissionId) throw new Error("ConversationEngine: submissionId required");
        if (!issueNumber || !issueUrl) {
          throw new Error("ConversationEngine: comment session not started");
        }
        const userTurn = {
          role: "user",
          content: userText,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          kind: "user"
        };
        this.state = { ...this.state, turns: [...this.state.turns, userTurn] };
        const res = await this.client.nextCommentTurn({
          submissionId,
          issueNumber,
          issueUrl,
          issueBody: this.commentIssueBody ?? "",
          userText,
          transcript: this.state.turns,
          knownFacts: this.state.knownFacts,
          selectedModelId: this.state.selectedModelId,
          repo: this.context.repo,
          panelRepo: this.context.panelRepo
        });
        this.state = { ...this.state, knownFacts: res.knownFacts };
        if (res.toolCall.type === "draft_issue" || res.toolCall.type === "revise_draft") {
          this.commentDraftBody = res.toolCall.draft.body;
        }
        return this.applyToolCall(res.toolCall);
      }
      async approveComment(body) {
        if (!this.client) throw new Error("ConversationEngine: client not set");
        if (!this.state.submissionId) throw new Error("ConversationEngine: submissionId required");
        const result = await this.client.postComment(this.state.submissionId, body);
        return result;
      }
      reset() {
        this.state = {
          turns: [],
          phase: "greeting",
          questionIndex: 0
        };
        this.commentIssueBody = void 0;
        this.commentDraftBody = void 0;
      }
      // ── Saved sessions ─────────────────────────────────────────────────────────
      /**
       * Snapshot the current conversation into the saved-sessions list, then
       * reset to a fresh session. Returns the new (current) session id.
       */
      newSession() {
        this.snapshotCurrentIfMeaningful();
        this.currentSessionId = makeSessionId();
        this.reset();
        return this.currentSessionId;
      }
      /**
       * Snapshot the current conversation, then load a previously saved one.
       * The previously-saved session is removed from the saved list and becomes
       * current. Returns the loaded session id.
       */
      switchToSession(id) {
        const target = this.savedSessions.find((s) => s.id === id);
        if (!target) throw new Error(`ConversationEngine: no saved session ${id}`);
        this.snapshotCurrentIfMeaningful();
        this.savedSessions = this.savedSessions.filter((s) => s.id !== id);
        this.currentSessionId = target.id;
        this.currentModeId = target.modeId;
        this.state = { ...target.state };
        return target.id;
      }
      listSavedSessions() {
        return [...this.savedSessions];
      }
      getCurrentSessionId() {
        return this.currentSessionId;
      }
      /**
       * Drop the saved-sessions list and reset the current session id.
       * Called when the panel is closed entirely (saved sessions are scoped to
       * a single panel-open lifecycle, mirroring the portal behavior).
       */
      clearSavedSessions() {
        this.savedSessions = [];
        this.currentSessionId = makeSessionId();
      }
      snapshotCurrentIfMeaningful() {
        const hasUserTurn = this.state.turns.some((t) => t.role === "user");
        if (!hasUserTurn) return;
        if (!this.currentModeId) return;
        const firstUser = this.state.turns.find((t) => t.role === "user");
        const label = (firstUser?.content ?? "").slice(0, 40) || "Conversation";
        this.savedSessions = [
          ...this.savedSessions,
          {
            id: this.currentSessionId,
            modeId: this.currentModeId,
            savedAt: (/* @__PURE__ */ new Date()).toISOString(),
            state: { ...this.state },
            label
          }
        ];
      }
    };
  }
});

// ../core/src/navigation.ts
var MAX_ENTRIES, NavigationTracker;
var init_navigation = __esm({
  "../core/src/navigation.ts"() {
    "use strict";
    MAX_ENTRIES = 20;
    NavigationTracker = class {
      constructor(enabled) {
        __publicField(this, "entries", []);
        __publicField(this, "enabled");
        __publicField(this, "originalPushState", null);
        __publicField(this, "originalReplaceState", null);
        __publicField(this, "popstateHandler", null);
        this.enabled = enabled && typeof window !== "undefined";
        if (!this.enabled) return;
        this.record();
        this.originalPushState = history.pushState.bind(history);
        this.originalReplaceState = history.replaceState.bind(history);
        history.pushState = (...args) => {
          this.originalPushState(...args);
          this.record();
        };
        history.replaceState = (...args) => {
          this.originalReplaceState(...args);
          this.record();
        };
        this.popstateHandler = () => this.record();
        window.addEventListener("popstate", this.popstateHandler);
      }
      record() {
        const entry = {
          url: window.location.href,
          title: document.title,
          ts: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.entries.push(entry);
        if (this.entries.length > MAX_ENTRIES) {
          this.entries = this.entries.slice(-MAX_ENTRIES);
        }
      }
      getBreadcrumb() {
        return [...this.entries];
      }
      destroy() {
        if (!this.enabled) return;
        if (this.originalPushState) history.pushState = this.originalPushState;
        if (this.originalReplaceState) history.replaceState = this.originalReplaceState;
        if (this.popstateHandler) window.removeEventListener("popstate", this.popstateHandler);
        this.entries = [];
      }
    };
  }
});

// ../core/src/modes.ts
var BUILT_IN_MODES, ModeRegistry;
var init_modes = __esm({
  "../core/src/modes.ts"() {
    "use strict";
    BUILT_IN_MODES = [
      {
        id: "feedback",
        label: "Feedback",
        description: "Report an issue or share feedback",
        comingSoon: false,
        mode: "agentic",
        questions: [
          {
            id: "opener",
            text: "What's going on? A quick format tip: tell me (1) what you were doing, (2) what happened, and (3) what you expected. Screenshots and files are welcome."
          }
        ]
      },
      {
        id: "bug-report",
        label: "Bug Report",
        description: "Detailed technical bug report",
        comingSoon: true,
        questions: []
      },
      {
        id: "ai-chat",
        label: "AI Chat",
        description: "Chat with an AI assistant",
        comingSoon: true,
        questions: []
      },
      {
        id: "support",
        label: "Support",
        description: "Get help from the team",
        comingSoon: true,
        questions: []
      }
    ];
    ModeRegistry = class {
      constructor(modes = BUILT_IN_MODES) {
        __publicField(this, "modes", /* @__PURE__ */ new Map());
        for (const mode of modes) {
          this.modes.set(mode.id, mode);
        }
      }
      register(mode) {
        this.modes.set(mode.id, mode);
      }
      get(id) {
        const mode = this.modes.get(id);
        if (!mode) throw new Error(`Mode not found: ${id}`);
        return mode;
      }
      getAll() {
        return Array.from(this.modes.values());
      }
      getActive() {
        return this.getAll().filter((m) => !m.comingSoon);
      }
    };
  }
});

// ../core/src/client.ts
var PanelApiClient;
var init_client = __esm({
  "../core/src/client.ts"() {
    "use strict";
    PanelApiClient = class {
      constructor({
        apiUrl,
        apiKey,
        githubLogin,
        githubLoginGetter
      }) {
        __publicField(this, "apiUrl");
        __publicField(this, "apiKey");
        __publicField(this, "githubLoginGetter");
        this.apiUrl = apiUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
        this.githubLoginGetter = githubLoginGetter ?? (() => githubLogin);
      }
      headers() {
        const h = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`
        };
        const login = this.githubLoginGetter();
        if (login) h["x-github-login"] = login;
        return h;
      }
      async getCapabilities() {
        const res = await fetch(`${this.apiUrl}/v1/panel/capabilities`, {
          headers: this.headers()
        });
        if (!res.ok) throw new Error(`Capabilities fetch failed: ${res.status}`);
        return res.json();
      }
      async getRepoContext(params) {
        const res = await fetch(`${this.apiUrl}/v1/panel/repo-context`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(params)
        });
        if (!res.ok) throw new Error(`Repo context fetch failed: ${res.status}`);
        return res.json();
      }
      /** Get a signed upload URL, upload directly to Supabase storage, return storage URL */
      async uploadAttachment(blob, filename) {
        const signRes = await fetch(`${this.apiUrl}/v1/panel/upload-url`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ filename, contentType: blob.type })
        });
        if (!signRes.ok) throw new Error(`Failed to get upload URL: ${signRes.status}`);
        const { uploadUrl, storageUrl } = await signRes.json();
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": blob.type }
        });
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
        return storageUrl;
      }
      async nextTurn(req) {
        const res = await fetch(`${this.apiUrl}/v1/panel/next-turn`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(req)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`nextTurn failed (${res.status}): ${text}`);
        }
        return res.json();
      }
      async patchDraft(id, draft) {
        const res = await fetch(`${this.apiUrl}/v1/panel/draft/${id}`, {
          method: "PATCH",
          headers: this.headers(),
          body: JSON.stringify({ draft })
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`patchDraft failed (${res.status}): ${text}`);
        }
      }
      async nextCommentTurn(req) {
        const res = await fetch(`${this.apiUrl}/v1/panel/comment-next-turn`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(req)
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`nextCommentTurn failed (${res.status}): ${text}`);
        }
        return res.json();
      }
      async postComment(submissionId, body) {
        const res = await fetch(`${this.apiUrl}/v1/panel/comment`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ submissionId, body })
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`postComment failed (${res.status}): ${text}`);
        }
        return res.json();
      }
      async submit(payload) {
        const res = await fetch(`${this.apiUrl}/v1/panel/submit`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify(payload)
        });
        if (res.status === 422) {
          const data = await res.json();
          const err = new Error(data.reason ?? data.error ?? "Draft not ready");
          err.status = 422;
          err.requiresConfirm = Boolean(data.requiresConfirm);
          err.reason = data.reason ?? data.error ?? "Draft not ready";
          throw err;
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Submit failed (${res.status}): ${text}`);
        }
        return res.json();
      }
      async streamProcess(id, onEvent, options) {
        const res = await fetch(`${this.apiUrl}/v1/panel/process/${id}`, {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({ repo: options?.repo ?? "", panelRepo: options?.panelRepo })
        });
        if (!res.ok) throw new Error(`Process stream failed: ${res.status}`);
        if (!res.body) throw new Error("Response body is null");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                onEvent(event);
              } catch {
              }
            }
          }
        }
        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                onEvent(event);
              } catch {
              }
            }
          }
        }
      }
    };
  }
});

// ../core/src/sdk.ts
var PanelSDK;
var init_sdk = __esm({
  "../core/src/sdk.ts"() {
    "use strict";
    init_client();
    init_conversation();
    init_metadata();
    init_modes();
    init_navigation();
    init_voice();
    PanelSDK = class {
      constructor(config) {
        __publicField(this, "config");
        __publicField(this, "client");
        __publicField(this, "metadata");
        __publicField(this, "modes");
        __publicField(this, "voice");
        __publicField(this, "conversation");
        __publicField(this, "navigation");
        __publicField(this, "capabilities", null);
        __publicField(this, "resolvedGithubLogin");
        if (!config.apiUrl) throw new Error("PanelSDK: apiUrl is required");
        if (!config.apiKey) throw new Error("PanelSDK: apiKey is required");
        if (!config.repo) throw new Error("PanelSDK: repo is required");
        this.config = config;
        this.resolvedGithubLogin = config.githubLogin;
        this.client = new PanelApiClient({
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          githubLoginGetter: () => this.resolvedGithubLogin
        });
        this.metadata = new MetadataCollector();
        this.modes = new ModeRegistry();
        this.voice = new VoiceInput();
        this.conversation = new ConversationEngine(this.modes);
        this.conversation.setClient(this.client);
        this.conversation.setContext({
          repo: config.repo,
          panelRepo: config.panelRepo,
          githubLogin: this.resolvedGithubLogin
        });
        if (config.defaultModelId) {
          this.conversation.setSelectedModelId(config.defaultModelId);
        }
        this.navigation = new NavigationTracker(config.navigationTracking === true);
      }
      async init() {
        if (this.config.resolveGithubLogin) {
          try {
            const login = await this.config.resolveGithubLogin();
            if (login) {
              this.resolvedGithubLogin = login;
              this.conversation.setContext({
                repo: this.config.repo,
                panelRepo: this.config.panelRepo,
                githubLogin: login
              });
            }
          } catch {
          }
        }
        this.capabilities = await this.client.getCapabilities();
        if (!this.config.defaultModelId && this.capabilities?.defaultModelId) {
          this.conversation.setSelectedModelId(this.capabilities.defaultModelId);
        }
      }
      getGithubLogin() {
        return this.resolvedGithubLogin;
      }
      setSelectedModelId(id) {
        this.conversation.setSelectedModelId(id);
      }
      getCapabilities() {
        return this.capabilities;
      }
      getAvailableModes() {
        return this.capabilities?.modes ?? [];
      }
      destroy() {
        this.metadata.destroy();
        this.voice.abort();
        this.navigation.destroy();
      }
    };
  }
});

// ../core/src/models.ts
var init_models = __esm({
  "../core/src/models.ts"() {
    "use strict";
  }
});

// ../core/src/index.ts
var init_src = __esm({
  "../core/src/index.ts"() {
    "use strict";
    init_metadata();
    init_capture();
    init_voice();
    init_conversation();
    init_navigation();
    init_modes();
    init_client();
    init_sdk();
    init_models();
  }
});

// src/PanelProvider.tsx
var PanelProvider_exports = {};
__export(PanelProvider_exports, {
  PanelProvider: () => PanelProvider,
  usePanelContext: () => usePanelContext
});
function usePanelContext() {
  const ctx = (0, import_react.useContext)(PanelContext);
  if (!ctx) throw new Error("usePanelContext must be used within PanelProvider");
  return ctx;
}
function PanelProvider({ config, children }) {
  const sdkRef = (0, import_react.useRef)(null);
  const sdk = (0, import_react.useMemo)(() => {
    if (sdkRef.current) sdkRef.current.destroy();
    const s = new PanelSDK(config);
    sdkRef.current = s;
    return s;
  }, [config.apiUrl, config.apiKey, config.repo, config.panelRepo, config.githubLogin]);
  const [capabilities, setCapabilities] = (0, import_react.useState)(null);
  const [activeModeId, setActiveModeId] = (0, import_react.useState)("feedback");
  const [isOpen, setIsOpenState] = (0, import_react.useState)(false);
  const [selectedModelId, setSelectedModelIdState] = (0, import_react.useState)(
    config.defaultModelId
  );
  const [savedSessions, setSavedSessions] = (0, import_react.useState)([]);
  const [currentSessionId, setCurrentSessionId] = (0, import_react.useState)(
    () => sdk.conversation.getCurrentSessionId()
  );
  const panelElementRef = (0, import_react.useRef)(null);
  const setIsOpen = (open) => {
    if (!open && isOpen) {
      sdk.conversation.clearSavedSessions();
      setSavedSessions([]);
      setCurrentSessionId(sdk.conversation.getCurrentSessionId());
    }
    setIsOpenState(open);
  };
  const newSession = () => {
    const newId = sdk.conversation.newSession();
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(newId);
  };
  const switchSession = (id) => {
    const switched = sdk.conversation.switchToSession(id);
    setSavedSessions(sdk.conversation.listSavedSessions());
    setCurrentSessionId(switched);
  };
  const registerPanelElement = (el) => {
    panelElementRef.current = el;
  };
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    sdk.init().then(() => {
      if (!cancelled) {
        const caps = sdk.getCapabilities();
        setCapabilities(caps);
        const modes = sdk.getAvailableModes();
        if (modes.length > 0) setActiveModeId(modes[0]);
        if (!config.defaultModelId && caps?.defaultModelId) {
          setSelectedModelIdState(caps.defaultModelId);
          sdk.setSelectedModelId(caps.defaultModelId);
        }
      }
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[Panel] SDK init failed: ${msg}. Check your apiUrl, apiKey, and PANEL_ALLOWED_ORIGINS backend config. The panel button will not render until init succeeds.`
      );
    });
    return () => {
      cancelled = true;
      sdk.destroy();
    };
  }, [sdk, config.defaultModelId]);
  const setSelectedModelId = (id) => {
    setSelectedModelIdState(id);
    sdk.setSelectedModelId(id);
  };
  const betaModelSelection = config.betaModelSelection ?? capabilities?.betaModelSelection ?? false;
  const availableModels = (0, import_react.useMemo)(() => {
    if (config.availableModels && config.availableModels.length > 0) return config.availableModels;
    return capabilities?.models ?? [];
  }, [config.availableModels, capabilities?.models]);
  const value = (0, import_react.useMemo)(
    () => ({
      sdk,
      capabilities,
      activeModeId,
      setActiveModeId,
      isOpen,
      setIsOpen,
      selectedModelId,
      setSelectedModelId,
      betaModelSelection,
      availableModels,
      savedSessions,
      currentSessionId,
      newSession,
      switchSession,
      panelElementRef,
      registerPanelElement
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sdk, capabilities, activeModeId, isOpen, selectedModelId, betaModelSelection, availableModels, savedSessions, currentSessionId]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelContext.Provider, { value, children });
}
var import_react, import_jsx_runtime, PanelContext;
var init_PanelProvider = __esm({
  "src/PanelProvider.tsx"() {
    "use strict";
    import_react = require("react");
    init_src();
    import_jsx_runtime = require("react/jsx-runtime");
    PanelContext = (0, import_react.createContext)(null);
  }
});

// src/floating/PanelButton.tsx
var PanelButton_exports = {};
__export(PanelButton_exports, {
  PanelButton: () => PanelButton
});
function PanelButton() {
  const { isOpen, setIsOpen, capabilities } = usePanelContext();
  if (!capabilities) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    "button",
    {
      className: "panel-button",
      "aria-label": isOpen ? "Close feedback panel" : "Open feedback panel",
      onClick: () => setIsOpen(!isOpen),
      children: isOpen ? (
        // X icon
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
        ] })
      ) : (
        // Chat bubble icon
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) })
      )
    }
  );
}
var import_jsx_runtime2;
var init_PanelButton = __esm({
  "src/floating/PanelButton.tsx"() {
    "use strict";
    init_PanelProvider();
    import_jsx_runtime2 = require("react/jsx-runtime");
  }
});

// src/chat/PreviewCard.tsx
function PreviewCard(props) {
  if (!props.editable) {
    const { preview } = props;
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-preview", children: [
      preview.screenshotUrl && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "img",
        {
          src: preview.screenshotUrl,
          alt: "Screenshot",
          style: { width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-preview-summary", children: preview.plainSummary }),
      preview.technicalDetails && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: "panel-preview-details", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: "Technical details" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-preview-details-content", children: preview.technicalDetails })
      ] })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EditableDraft, { ...props });
}
function EditableDraft({
  draft,
  onDraftChange,
  onSubmit,
  onRequestChanges,
  screenshotUrl,
  mode = "issue"
}) {
  const [submitting, setSubmitting] = (0, import_react2.useState)(false);
  const [confirm, setConfirm] = (0, import_react2.useState)(null);
  const [reviseText, setReviseText] = (0, import_react2.useState)("");
  const [error, setError] = (0, import_react2.useState)(null);
  const commentMode = mode === "comment";
  const doSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      setConfirm(null);
    } catch (err) {
      const e = err;
      if (e?.status === 422 && e.requiresConfirm) {
        setConfirm(e.reason ?? "This draft looks thin. Submit anyway?");
      } else {
        setError(e?.message ?? "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const disabled = submitting || (commentMode ? !draft.body.trim() : !draft.title.trim() || !draft.body.trim());
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-preview panel-draft-edit", children: [
    screenshotUrl && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "img",
      {
        src: screenshotUrl,
        alt: "Screenshot",
        style: { width: "100%", maxHeight: 140, objectFit: "cover", display: "block" }
      }
    ),
    !commentMode && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        className: "panel-draft-title",
        type: "text",
        value: draft.title,
        placeholder: "Issue title",
        onChange: (e) => onDraftChange({ ...draft, title: e.target.value })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "textarea",
      {
        className: "panel-draft-body",
        value: draft.body,
        placeholder: commentMode ? "Comment body" : "What happened? Steps to reproduce, expected vs actual\u2026",
        rows: 6,
        onChange: (e) => onDraftChange({ ...draft, body: e.target.value })
      }
    ),
    !commentMode && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-draft-row", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "panel-draft-label", children: [
        "Severity",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "select",
          {
            value: draft.severity,
            onChange: (e) => onDraftChange({ ...draft, severity: e.target.value }),
            children: SEVERITIES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: s, children: s }, s))
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "panel-draft-label", children: [
        "Kind",
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "select",
          {
            value: draft.kind,
            onChange: (e) => onDraftChange({ ...draft, kind: e.target.value }),
            children: KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: k, children: k }, k))
          }
        )
      ] })
    ] }),
    confirm && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-draft-confirm", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { children: confirm }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "panel-draft-confirm-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            className: "panel-draft-submit",
            onClick: async () => {
              setSubmitting(true);
              try {
                await onSubmit();
                setConfirm(null);
              } catch (e) {
                setError(e.message);
              } finally {
                setSubmitting(false);
              }
            },
            disabled: submitting,
            children: "Submit anyway"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            className: "panel-draft-cancel",
            onClick: () => setConfirm(null),
            disabled: submitting,
            children: "Keep editing"
          }
        )
      ] })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-draft-error", children: error }),
    !confirm && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "button",
      {
        className: "panel-draft-submit",
        onClick: doSubmit,
        disabled,
        children: submitting ? "Submitting\u2026" : commentMode ? "Post comment" : "Submit issue"
      }
    ),
    onRequestChanges && !confirm && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "panel-draft-revise", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "input",
      {
        type: "text",
        className: "panel-draft-revise-input",
        value: reviseText,
        placeholder: "Or ask the agent to revise\u2026",
        onChange: (e) => setReviseText(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter" && reviseText.trim()) {
            onRequestChanges(reviseText.trim());
            setReviseText("");
          }
        }
      }
    ) })
  ] });
}
var import_react2, import_jsx_runtime3, SEVERITIES, KINDS;
var init_PreviewCard = __esm({
  "src/chat/PreviewCard.tsx"() {
    "use strict";
    import_react2 = require("react");
    import_jsx_runtime3 = require("react/jsx-runtime");
    SEVERITIES = ["blocker", "high", "medium", "low"];
    KINDS = ["bug", "feature", "feedback", "other"];
  }
});

// src/chat/SubmitButton.tsx
function SubmitButton({ modeId, onDone, componentHint, submissionEnhancer }) {
  const { sdk } = usePanelContext();
  const [phase, setPhase] = (0, import_react3.useState)("idle");
  const inflightRef = (0, import_react3.useRef)(false);
  const handleSubmit = async () => {
    if (inflightRef.current) return;
    if (phase !== "idle" && phase !== "error") return;
    inflightRef.current = true;
    setPhase("submitting");
    try {
      const metadata = sdk.metadata.collect();
      const consoleErrors = sdk.metadata.collectConsoleErrors();
      const consoleWarnings = sdk.metadata.collectConsoleWarnings();
      sdk.conversation.setMetadata(metadata);
      const basePayload = {
        transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__"),
        metadata,
        screenshotUrl: sdk.conversation.state.screenshotUrl,
        attachmentUrls: sdk.conversation.state.attachmentUrls,
        consoleErrors,
        consoleWarnings,
        repo: sdk.config.repo
      };
      if (sdk.config.navigationTracking) {
        basePayload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
      }
      if (componentHint) {
        basePayload.componentHint = componentHint;
      }
      const payload = submissionEnhancer ? submissionEnhancer(basePayload) : basePayload;
      const { id } = await sdk.client.submit(payload);
      setPhase("classifying");
      await sdk.client.streamProcess(id, (event) => {
        if (event.type === "progress") {
          const msg = event.message?.toLowerCase() ?? "";
          if (msg.includes("classif")) setPhase("classifying");
          else if (msg.includes("enrich") || msg.includes("format")) setPhase("classifying");
          else if (msg.includes("creating") || msg.includes("issue")) setPhase("creating");
          else if (msg.includes("routing")) setPhase("classifying");
        } else if (event.type === "completed") {
          setPhase("done");
          sdk.conversation.markSubmitted();
          onDone(event.issueUrl ?? "");
        } else if (event.type === "error") {
          setPhase("error");
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
    } catch {
      setPhase("error");
    } finally {
      inflightRef.current = false;
    }
  };
  const isLoading = phase !== "idle" && phase !== "error" && phase !== "done";
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "button",
    {
      className: "panel-submit-btn",
      onClick: handleSubmit,
      disabled: isLoading || phase === "done",
      children: [
        isLoading && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { display: "inline-flex", alignItems: "center", gap: 6 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "panel-spinner" }),
          PHASE_LABELS[phase]
        ] }),
        !isLoading && PHASE_LABELS[phase]
      ]
    }
  );
}
var import_react3, import_jsx_runtime4, PHASE_LABELS;
var init_SubmitButton = __esm({
  "src/chat/SubmitButton.tsx"() {
    "use strict";
    import_react3 = require("react");
    init_PanelProvider();
    import_jsx_runtime4 = require("react/jsx-runtime");
    PHASE_LABELS = {
      idle: "Submit Issue",
      submitting: "Submitting\u2026",
      classifying: "Classifying\u2026",
      creating: "Creating issue\u2026",
      done: "Done!",
      error: "Failed \u2014 retry?"
    };
  }
});

// src/capture/AnnotationEditor.tsx
function AnnotationEditor({ imageDataUrl, onDone, onCancel }) {
  const canvasRef = (0, import_react4.useRef)(null);
  const [activeTool, setActiveTool] = (0, import_react4.useState)("arrow");
  const [color, setColor] = (0, import_react4.useState)("#ef4444");
  const [annotations, setAnnotations] = (0, import_react4.useState)([]);
  const [isDrawing, setIsDrawing] = (0, import_react4.useState)(false);
  const [currentPoints, setCurrentPoints] = (0, import_react4.useState)([]);
  const imageRef = (0, import_react4.useRef)(null);
  (0, import_react4.useEffect)(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      redraw([]);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);
  const redraw = (0, import_react4.useCallback)((annots) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
    const x = (canvas.width - img.width * scale) / 2;
    const y = (canvas.height - img.height * scale) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    annots.forEach((a) => {
      ctx.strokeStyle = a.color;
      ctx.fillStyle = a.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (a.type === "arrow" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (a.type === "rect" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      } else if (a.type === "freehand" && a.points.length >= 2) {
        ctx.moveTo(a.points[0], a.points[1]);
        for (let i = 2; i < a.points.length; i += 2) {
          ctx.lineTo(a.points[i], a.points[i + 1]);
        }
        ctx.stroke();
      } else if (a.type === "text" && a.text && a.points.length >= 2) {
        ctx.font = "16px sans-serif";
        ctx.fillText(a.text, a.points[0], a.points[1]);
      } else if (a.type === "blur" && a.points.length >= 4) {
        const [x1, y1, x2, y2] = a.points;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      }
    });
  }, []);
  (0, import_react4.useEffect)(() => {
    redraw(annotations);
  }, [annotations, redraw]);
  const getPos = (e) => ({ x: e.clientX, y: e.clientY });
  const handleMouseDown = (e) => {
    if (activeTool === "text") {
      const input = prompt("Enter text:");
      if (input) {
        const newAnnot = {
          id: Date.now().toString(),
          type: "text",
          points: [e.clientX, e.clientY],
          color,
          text: input
        };
        setAnnotations((prev) => {
          const next = [...prev, newAnnot];
          redraw(next);
          return next;
        });
      }
      return;
    }
    setIsDrawing(true);
    setCurrentPoints([e.clientX, e.clientY]);
  };
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    if (activeTool === "freehand") {
      setCurrentPoints((prev) => [...prev, x, y]);
    } else {
      setCurrentPoints((prev) => [prev[0], prev[1], x, y]);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    redraw(annotations);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    const pts = activeTool === "freehand" ? [...currentPoints, x, y] : [currentPoints[0], currentPoints[1], x, y];
    if (activeTool === "arrow" && pts.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      ctx.lineTo(pts[2], pts[3]);
      ctx.stroke();
    } else if (activeTool === "rect" && pts.length >= 4) {
      ctx.strokeRect(pts[0], pts[1], pts[2] - pts[0], pts[3] - pts[1]);
    } else if (activeTool === "blur" && pts.length >= 4) {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(pts[0], pts[1], pts[2] - pts[0], pts[3] - pts[1]);
    }
  };
  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getPos(e);
    const finalPoints = activeTool === "freehand" ? [...currentPoints, x, y] : [currentPoints[0], currentPoints[1], x, y];
    if (finalPoints.length >= 2) {
      const newAnnot = {
        id: Date.now().toString(),
        type: activeTool,
        points: finalPoints,
        color
      };
      setAnnotations((prev) => {
        const next = [...prev, newAnnot];
        redraw(next);
        return next;
      });
    }
    setCurrentPoints([]);
  };
  const handleUndo = () => {
    setAnnotations((prev) => {
      const next = prev.slice(0, -1);
      redraw(next);
      return next;
    });
  };
  const handleDone = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onDone(blob);
    }, "image/png");
  };
  (0, import_react4.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") handleUndo();
      if (e.key === "Enter") handleDone();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [annotations]);
  const TOOLS = [
    { id: "arrow", label: "\u2192" },
    { id: "rect", label: "\u25A1" },
    { id: "freehand", label: "\u270F" },
    { id: "text", label: "T" },
    { id: "blur", label: "\u25FC" }
  ];
  const toolbar = /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    background: "#1e1e2e",
    padding: "8px 12px",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    zIndex: 2147483647,
    alignItems: "center"
  }, children: [
    TOOLS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "button",
      {
        title: t.id,
        onClick: () => setActiveTool(t.id),
        style: {
          width: 32,
          height: 32,
          borderRadius: 6,
          border: "none",
          background: activeTool === t.id ? "#6366f1" : "#2d2d3d",
          color: "#fff",
          cursor: "pointer",
          fontSize: 16
        },
        children: t.label
      },
      t.id
    )),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), style: { width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" } }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { onClick: handleUndo, title: "Undo (Ctrl+Z)", style: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#2d2d3d", color: "#fff", cursor: "pointer", fontSize: 12 }, children: "\u21A9" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { onClick: handleDone, style: { padding: "6px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }, children: "Done \u21B5" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { onClick: onCancel, style: { padding: "6px 10px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 12 }, children: "\u2715" })
  ] });
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "canvas",
        {
          ref: canvasRef,
          style: { position: "fixed", inset: 0, zIndex: 2147483646, cursor: "crosshair" },
          onMouseDown: handleMouseDown,
          onMouseMove: handleMouseMove,
          onMouseUp: handleMouseUp
        }
      ),
      toolbar
    ] }),
    document.body
  );
}
var import_react4, import_react_dom, import_jsx_runtime5;
var init_AnnotationEditor = __esm({
  "src/capture/AnnotationEditor.tsx"() {
    "use strict";
    import_react4 = require("react");
    import_react_dom = require("react-dom");
    import_jsx_runtime5 = require("react/jsx-runtime");
  }
});

// src/capture/ScreenshotCapture.tsx
function ScreenshotCapture({ onCaptured }) {
  const { sdk, panelElementRef } = usePanelContext();
  const [capturing, setCapturing] = (0, import_react5.useState)(false);
  const [dataUrl, setDataUrl] = (0, import_react5.useState)(null);
  const [thumbnail, setThumbnail] = (0, import_react5.useState)(null);
  const [pendingPanelBlob, setPendingPanelBlob] = (0, import_react5.useState)(null);
  const [error, setError] = (0, import_react5.useState)(null);
  const handleCapture = async () => {
    setCapturing(true);
    setError(null);
    try {
      const { page, panel } = await captureScreenshot({ panelEl: panelElementRef?.current ?? null });
      setPendingPanelBlob(panel ?? null);
      const url = await blobToDataUrl2(page);
      setDataUrl(url);
    } catch {
      setError("Screenshot capture failed");
    } finally {
      setCapturing(false);
    }
  };
  const handleAnnotationDone = async (blob) => {
    setDataUrl(null);
    setError(null);
    const ts = Date.now();
    const pageName = `screenshot-page-${ts}.png`;
    try {
      const url = await sdk.client.uploadAttachment(blob, pageName);
      sdk.conversation.setScreenshotUrl(url);
      sdk.conversation.addAttachment({ url, type: "screenshot", name: pageName, screenshotKind: "page" });
      setThumbnail(URL.createObjectURL(blob));
      onCaptured(url);
      if (pendingPanelBlob) {
        const panelName = `screenshot-panel-${ts}.png`;
        try {
          const panelUrl = await sdk.client.uploadAttachment(pendingPanelBlob, panelName);
          sdk.conversation.addAttachment({ url: panelUrl, type: "screenshot", name: panelName, screenshotKind: "panel" });
        } catch {
        }
      }
    } catch {
      setError("Upload failed");
    } finally {
      setPendingPanelBlob(null);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    dataUrl && /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      AnnotationEditor,
      {
        imageDataUrl: dataUrl,
        onDone: handleAnnotationDone,
        onCancel: () => setDataUrl(null)
      }
    ),
    error && /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "panel-capture-error", role: "alert", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { onClick: () => setError(null), "aria-label": "Dismiss", children: "\xD7" })
    ] }),
    thumbnail ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, padding: "0 0 8px" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("img", { src: thumbnail, alt: "Screenshot", style: { width: 48, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid var(--panel-border)" } }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          onClick: () => {
            setThumbnail(null);
            sdk.conversation.setScreenshotUrl("");
          },
          style: { fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "var(--panel-fg)", opacity: 0.6 },
          children: "Remove"
        }
      )
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "button",
      {
        className: "panel-attach-btn",
        "aria-label": "Add screenshot",
        onClick: handleCapture,
        disabled: capturing,
        title: "Add screenshot",
        children: capturing ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "panel-spinner" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("polyline", { points: "21 15 16 10 5 21" })
        ] })
      }
    )
  ] });
}
var import_react5, import_jsx_runtime6;
var init_ScreenshotCapture = __esm({
  "src/capture/ScreenshotCapture.tsx"() {
    "use strict";
    import_react5 = require("react");
    init_src();
    init_PanelProvider();
    init_AnnotationEditor();
    import_jsx_runtime6 = require("react/jsx-runtime");
  }
});

// src/input/FileAttachment.tsx
function FileAttachment({ onUploaded }) {
  const { sdk } = usePanelContext();
  const [uploading, setUploading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  (0, import_react6.useEffect)(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4e3);
    return () => clearTimeout(t);
  }, [error]);
  const handleChange = (0, import_react6.useCallback)(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 10 MB)");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    try {
      let blob = file;
      if (file.type.startsWith("image/") && file.size > 1024 * 1024) {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
        blob = compressed;
      }
      const url = await sdk.client.uploadAttachment(blob, file.name);
      sdk.conversation.addAttachment({ url, type: "file", name: file.name });
      onUploaded(url, file.name);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [sdk, onUploaded]);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "label",
      {
        className: `panel-attach-btn${uploading ? "" : ""}`,
        "aria-label": "Attach file",
        style: { cursor: uploading ? "not-allowed" : "pointer" },
        children: [
          uploading ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "panel-spinner" }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
            "input",
            {
              type: "file",
              accept: "image/*,.pdf,.txt,.md",
              style: { display: "none" },
              onChange: handleChange,
              disabled: uploading
            }
          )
        ]
      }
    ),
    error && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "panel-attach-error", role: "alert", children: error })
  ] });
}
var import_react6, import_jsx_runtime7, MAX_FILE_SIZE;
var init_FileAttachment = __esm({
  "src/input/FileAttachment.tsx"() {
    "use strict";
    import_react6 = require("react");
    init_PanelProvider();
    import_jsx_runtime7 = require("react/jsx-runtime");
    MAX_FILE_SIZE = 10 * 1024 * 1024;
  }
});

// src/chat/PanelChat.tsx
function PanelChat({ modeId, componentHint, submissionEnhancer, renderInputBarExtras }) {
  const { sdk } = usePanelContext();
  const [turns, setTurns] = (0, import_react7.useState)([]);
  const [preview, setPreview] = (0, import_react7.useState)(null);
  const [draft, setDraft] = (0, import_react7.useState)(null);
  const [phase, setPhase] = (0, import_react7.useState)("greeting");
  const [clarifyOptions, setClarifyOptions] = (0, import_react7.useState)(void 0);
  const [inputText, setInputText] = (0, import_react7.useState)("");
  const [isLoading, setIsLoading] = (0, import_react7.useState)(false);
  const [completed, setCompleted] = (0, import_react7.useState)(null);
  const [submitError, setSubmitError] = (0, import_react7.useState)(null);
  const [commentDraftBody, setCommentDraftBody] = (0, import_react7.useState)("");
  const [commentPosted, setCommentPosted] = (0, import_react7.useState)(null);
  const bottomRef = (0, import_react7.useRef)(null);
  const inputRef = (0, import_react7.useRef)(null);
  const started = (0, import_react7.useRef)(false);
  const submitInflightRef = (0, import_react7.useRef)(false);
  const syncFromSdk = () => {
    setTurns([...sdk.conversation.state.turns]);
    setDraft(sdk.conversation.state.draft ?? null);
    setPhase(sdk.conversation.state.phase);
    setClarifyOptions(sdk.conversation.state.clarifyOptions);
  };
  (0, import_react7.useEffect)(() => {
    if (started.current) return;
    started.current = true;
    if (sdk.conversation.state.turns.length > 0) {
      syncFromSdk();
      try {
        sdk.conversation.setMetadata(sdk.metadata.collect());
      } catch {
      }
      return () => {
        started.current = false;
      };
    }
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    setCompleted(null);
    setCommentPosted(null);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
    }
    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
    }).catch(() => {
      setTurns([{
        role: "assistant",
        content: "Thanks for reaching out! What would you like to report?",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    });
    return () => {
      started.current = false;
    };
  }, [modeId]);
  (0, import_react7.useEffect)(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, preview, draft]);
  const sendUserText = async (text) => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
      if (phase === "commenting") {
        await sdk.conversation.respondToComment(text);
        setCommentDraftBody(sdk.conversation.getCommentDraftBody() ?? commentDraftBody);
      } else {
        const response = await sdk.conversation.respond(modeId, text);
        if (response.content === "__preview__") {
          setPreview(sdk.conversation.getPreview());
        }
      }
      syncFromSdk();
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    await sendUserText(text);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const handleDone = (issueUrl, issueNumber) => {
    setCompleted({ issueUrl, issueNumber });
  };
  const handleReset = () => {
    started.current = false;
    setCompleted(null);
    setCommentPosted(null);
    sdk.conversation.reset();
    setTurns([]);
    setPreview(null);
    setDraft(null);
    try {
      sdk.conversation.setMetadata(sdk.metadata.collect());
    } catch {
    }
    sdk.conversation.start(modeId).then(() => {
      syncFromSdk();
      started.current = true;
    });
  };
  const submitAgenticDraft = async (confirmBypass = false) => {
    if (submitInflightRef.current) return;
    if (!draft) return;
    submitInflightRef.current = true;
    setSubmitError(null);
    const metadata = sdk.metadata.collect();
    sdk.conversation.setMetadata(metadata);
    if (sdk.conversation.state.submissionId) {
      try {
        await sdk.conversation.patchDraft(draft);
      } catch (e) {
        console.warn("[Panel] patchDraft failed:", e);
      }
    }
    const payload = {
      transcript: sdk.conversation.state.turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__"),
      metadata,
      screenshotUrl: sdk.conversation.state.screenshotUrl,
      attachmentUrls: sdk.conversation.state.attachmentUrls,
      consoleErrors: sdk.metadata.collectConsoleErrors(),
      consoleWarnings: sdk.metadata.collectConsoleWarnings(),
      repo: sdk.config.repo,
      submissionId: sdk.conversation.state.submissionId,
      useDraft: true,
      confirmBypass,
      selectedModelId: sdk.conversation.state.selectedModelId
    };
    if (sdk.config.navigationTracking) {
      payload.navigationBreadcrumb = sdk.navigation.getBreadcrumb();
    }
    if (componentHint) payload.componentHint = componentHint;
    const finalPayload = submissionEnhancer ? submissionEnhancer(payload) : payload;
    try {
      const { id } = await sdk.client.submit(finalPayload);
      let pipelineError = null;
      await sdk.client.streamProcess(id, (event) => {
        if (event.type === "completed") {
          sdk.conversation.markSubmitted(event.issueUrl, event.issueNumber);
          setCompleted({ issueUrl: event.issueUrl ?? "", issueNumber: event.issueNumber });
        } else if (event.type === "error") {
          pipelineError = event.message ?? "Pipeline failed";
        }
      }, { repo: sdk.config.repo, panelRepo: sdk.config.panelRepo });
      if (pipelineError) {
        throw new Error(pipelineError);
      }
    } finally {
      submitInflightRef.current = false;
    }
  };
  const requestDraftChanges = async (text) => {
    await sendUserText(text);
  };
  const startCommentSession = async () => {
    if (!completed?.issueNumber) return;
    const issueBody = draft?.body ?? "";
    await sdk.conversation.startCommentSession(
      completed.issueNumber,
      completed.issueUrl,
      issueBody
    );
    syncFromSdk();
    setCompleted(null);
    setCommentDraftBody("");
  };
  const approveComment = async () => {
    const body = commentDraftBody.trim();
    if (!body) return;
    const result = await sdk.conversation.approveComment(body);
    setCommentPosted(result.commentUrl);
  };
  const isAgentic = sdk.conversation.state.mode === "agentic";
  if (completed && phase !== "commenting") {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "panel-chat", style: { alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { width: "40", height: "40", viewBox: "0 0 24 24", fill: "none", stroke: "#22c55e", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polyline", { points: "22 4 12 14.01 9 11.01" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { fontSize: 14, marginTop: 8 }, children: "Issue created!" }),
      completed.issueUrl && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("a", { href: completed.issueUrl, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 13, color: "var(--panel-accent)" }, children: "View on GitHub \u2192" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 12 }, children: [
        completed.issueNumber && isAgentic && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            onClick: startCommentSession,
            style: { fontSize: 13, background: "var(--panel-accent)", color: "var(--panel-accent-fg)", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
            children: "Request changes"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "button",
          {
            onClick: handleReset,
            style: { fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" },
            children: "Submit another"
          }
        )
      ] })
    ] });
  }
  if (commentPosted) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "panel-chat", style: { alignItems: "center", justifyContent: "center", textAlign: "center" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { style: { fontSize: 14 }, children: "Comment posted!" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("a", { href: commentPosted, target: "_blank", rel: "noopener noreferrer", style: { fontSize: 13, color: "var(--panel-accent)" }, children: "View on GitHub \u2192" }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          onClick: handleReset,
          style: { marginTop: 12, fontSize: 13, background: "none", border: "1px solid var(--panel-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--panel-fg)" },
          children: "Submit another"
        }
      )
    ] });
  }
  const visibleTurns = turns.filter((t) => t.content !== "__preview__" && t.content !== "__draft__");
  const inDrafting = phase === "drafting";
  const inCommenting = phase === "commenting";
  const inScriptedPreview = phase === "preview";
  const hideInput = inDrafting || inScriptedPreview;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "panel-chat", children: [
      visibleTurns.map((turn, i) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `panel-message ${turn.role} ${turn.kind ?? ""}`, children: turn.content }, i)),
      clarifyOptions && clarifyOptions.length > 0 && !isLoading && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "panel-clarify-options", children: clarifyOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "panel-clarify-option",
          onClick: () => sendUserText(opt),
          children: opt
        },
        opt
      )) }),
      isAgentic && inDrafting && draft && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        PreviewCard,
        {
          editable: true,
          draft,
          onDraftChange: (d) => {
            setDraft(d);
            sdk.conversation.updateDraft(d);
          },
          onSubmit: () => submitAgenticDraft(Boolean(submitError)),
          onRequestChanges: requestDraftChanges,
          screenshotUrl: sdk.conversation.state.screenshotUrl
        }
      ),
      isAgentic && inCommenting && /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        PreviewCard,
        {
          editable: true,
          mode: "comment",
          draft: {
            title: "",
            body: commentDraftBody,
            severity: "medium",
            kind: "feedback"
          },
          onDraftChange: (d) => setCommentDraftBody(d.body),
          onSubmit: approveComment
        }
      ),
      !isAgentic && inScriptedPreview && preview && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(PreviewCard, { preview }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          SubmitButton,
          {
            modeId,
            onDone: handleDone,
            componentHint,
            submissionEnhancer
          }
        )
      ] }),
      isLoading && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "panel-progress", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { className: "panel-spinner" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "Thinking\u2026" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { ref: bottomRef })
    ] }),
    !hideInput && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "panel-input-bar", children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ScreenshotCapture, { onCaptured: () => {
      } }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(FileAttachment, { onUploaded: () => {
      } }),
      renderInputBarExtras?.(),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "textarea",
        {
          ref: inputRef,
          className: "panel-input",
          value: inputText,
          onChange: (e) => setInputText(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "Type your message\u2026",
          rows: 1,
          disabled: isLoading
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
        "button",
        {
          className: "panel-send-btn",
          onClick: handleSend,
          disabled: !inputText.trim() || isLoading,
          "aria-label": "Send",
          children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
          ] })
        }
      )
    ] })
  ] });
}
var import_react7, import_jsx_runtime8;
var init_PanelChat = __esm({
  "src/chat/PanelChat.tsx"() {
    "use strict";
    import_react7 = require("react");
    init_PanelProvider();
    init_PreviewCard();
    init_SubmitButton();
    init_ScreenshotCapture();
    init_FileAttachment();
    import_jsx_runtime8 = require("react/jsx-runtime");
  }
});

// src/chat/ModelPicker.tsx
function ModelPicker() {
  const { betaModelSelection, availableModels, selectedModelId, setSelectedModelId } = usePanelContext();
  if (!betaModelSelection || availableModels.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "panel-model-picker", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { className: "panel-model-picker-label", htmlFor: "panel-model-select", children: "Model" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "select",
      {
        id: "panel-model-select",
        className: "panel-model-select",
        value: selectedModelId ?? "",
        onChange: (e) => setSelectedModelId(e.target.value),
        children: availableModels.map((m) => /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("option", { value: m.id, children: [
          m.label,
          " \xB7 ",
          m.provider
        ] }, m.id))
      }
    )
  ] });
}
var import_jsx_runtime9;
var init_ModelPicker = __esm({
  "src/chat/ModelPicker.tsx"() {
    "use strict";
    init_PanelProvider();
    import_jsx_runtime9 = require("react/jsx-runtime");
  }
});

// src/floating/SessionsBar.tsx
function SessionsBar() {
  const { savedSessions, newSession, switchSession } = usePanelContext();
  if (savedSessions.length === 0) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "panel-sessions-bar", role: "tablist", "aria-label": "Saved sessions", children: [
    savedSessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "button",
      {
        className: "panel-session-chip",
        onClick: () => switchSession(s.id),
        title: s.label,
        children: s.label
      },
      s.id
    )),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      "button",
      {
        className: "panel-session-chip panel-session-new",
        onClick: newSession,
        title: "Start a new conversation",
        "aria-label": "New session",
        children: "+ New"
      }
    )
  ] });
}
var import_jsx_runtime10;
var init_SessionsBar = __esm({
  "src/floating/SessionsBar.tsx"() {
    "use strict";
    init_PanelProvider();
    import_jsx_runtime10 = require("react/jsx-runtime");
  }
});

// src/floating/PanelSheet.tsx
var PanelSheet_exports = {};
__export(PanelSheet_exports, {
  PanelSheet: () => PanelSheet
});
function PanelSheet({ componentHint, submissionEnhancer, renderInputBarExtras } = {}) {
  const { isOpen, setIsOpen, capabilities, activeModeId, setActiveModeId, currentSessionId, registerPanelElement } = usePanelContext();
  const sheetRef = (0, import_react8.useRef)(null);
  (0, import_react8.useEffect)(() => {
    if (isOpen) {
      registerPanelElement(sheetRef.current);
      return () => registerPanelElement(null);
    }
    return void 0;
  }, [isOpen, registerPanelElement]);
  (0, import_react8.useEffect)(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);
  (0, import_react8.useEffect)(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target)) {
        const target = e.target;
        if (!target.closest(".panel-button")) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [isOpen, setIsOpen]);
  if (!isOpen || !capabilities) return null;
  const allModes = ["feedback", "bug-report", "ai-chat", "support"];
  const availableModes = capabilities.modes ?? ["feedback"];
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "panel-sheet", ref: sheetRef, role: "dialog", "aria-label": "Feedback panel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ModelPicker, {}),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SessionsBar, {}),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "panel-tabs", role: "tablist", children: allModes.map((modeId) => {
      const isAvailable = availableModes.includes(modeId);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          role: "tab",
          className: `panel-tab ${activeModeId === modeId ? "active" : ""}`,
          disabled: !isAvailable,
          title: !isAvailable ? "Coming soon" : void 0,
          onClick: () => isAvailable && setActiveModeId(modeId),
          "aria-selected": activeModeId === modeId,
          children: [
            MODE_LABELS[modeId] ?? modeId,
            !isAvailable && " \u{1F512}"
          ]
        },
        modeId
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      PanelChat,
      {
        modeId: activeModeId,
        componentHint,
        submissionEnhancer,
        renderInputBarExtras
      },
      currentSessionId
    )
  ] });
}
var import_react8, import_jsx_runtime11, MODE_LABELS;
var init_PanelSheet = __esm({
  "src/floating/PanelSheet.tsx"() {
    "use strict";
    import_react8 = require("react");
    init_PanelProvider();
    init_PanelChat();
    init_ModelPicker();
    init_SessionsBar();
    import_jsx_runtime11 = require("react/jsx-runtime");
    MODE_LABELS = {
      feedback: "Feedback",
      "bug-report": "Bug Report",
      "ai-chat": "AI Chat",
      support: "Support"
    };
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AnnotationEditor: () => AnnotationEditor,
  FileAttachment: () => FileAttachment,
  PanelButton: () => PanelButton,
  PanelChat: () => PanelChat,
  PanelProvider: () => PanelProvider,
  PanelSheet: () => PanelSheet,
  PreviewCard: () => PreviewCard,
  ScreenshotCapture: () => ScreenshotCapture,
  SubmitButton: () => SubmitButton,
  VoiceInput: () => VoiceInput2,
  mountPanel: () => mountPanel,
  usePanelContext: () => usePanelContext
});
module.exports = __toCommonJS(index_exports);

// src/mount.ts
function mountPanel(config, container) {
  if (typeof document === "undefined") {
    return () => {
    };
  }
  let root = null;
  let hostEl = null;
  let shadowRoot = null;
  const mount = async () => {
    const [React10, { createRoot }, { PanelProvider: PanelProvider2 }, { PanelButton: PanelButton2 }, { PanelSheet: PanelSheet2 }] = await Promise.all([
      import("react"),
      import("react-dom/client"),
      Promise.resolve().then(() => (init_PanelProvider(), PanelProvider_exports)),
      Promise.resolve().then(() => (init_PanelButton(), PanelButton_exports)),
      Promise.resolve().then(() => (init_PanelSheet(), PanelSheet_exports))
    ]);
    hostEl = container ?? document.createElement("div");
    hostEl.id = "consiliency-panel-root";
    if (!container) document.body.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`;
    shadowRoot.appendChild(styleEl);
    const mountPoint = document.createElement("div");
    shadowRoot.appendChild(mountPoint);
    root = createRoot(mountPoint);
    root.render(
      React10.createElement(PanelProvider2, { config }, [
        React10.createElement(PanelButton2, { key: "btn" }),
        React10.createElement(PanelSheet2, { key: "sheet" })
      ])
    );
  };
  mount();
  return () => {
    root?.unmount();
    if (hostEl && !container && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
  };
}

// src/index.ts
init_PanelProvider();
init_PanelButton();
init_PanelSheet();
init_PanelChat();
init_PreviewCard();
init_SubmitButton();
init_AnnotationEditor();
init_ScreenshotCapture();

// src/input/VoiceInput.tsx
var import_react9 = require("react");
init_src();
init_PanelProvider();
var import_jsx_runtime12 = require("react/jsx-runtime");
function VoiceInput2({ modeId: _modeId, onTranscript }) {
  const { sdk } = usePanelContext();
  const [isRecording, setIsRecording] = (0, import_react9.useState)(false);
  const [isSupported] = (0, import_react9.useState)(() => VoiceInput.isSupported());
  const transcriptRef = (0, import_react9.useRef)("");
  const handleStart = (0, import_react9.useCallback)(() => {
    if (!isSupported || isRecording) return;
    transcriptRef.current = "";
    sdk.voice.onInterim = (text) => {
      transcriptRef.current = text;
    };
    sdk.voice.start();
    setIsRecording(true);
  }, [isSupported, isRecording, sdk.voice]);
  const handleStop = (0, import_react9.useCallback)(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    const final = await sdk.voice.stop();
    const text = final || transcriptRef.current;
    if (text.trim()) onTranscript(text.trim());
  }, [isRecording, sdk.voice, onTranscript]);
  if (!isSupported) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
    "button",
    {
      className: `panel-voice-btn${isRecording ? " recording" : ""}`,
      "aria-label": isRecording ? "Stop recording" : "Hold to speak",
      onMouseDown: handleStart,
      onMouseUp: handleStop,
      onTouchStart: (e) => {
        e.preventDefault();
        handleStart();
      },
      onTouchEnd: handleStop,
      children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("line", { x1: "12", y1: "19", x2: "12", y2: "23" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("line", { x1: "8", y1: "23", x2: "16", y2: "23" })
      ] })
    }
  );
}

// src/index.ts
init_FileAttachment();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AnnotationEditor,
  FileAttachment,
  PanelButton,
  PanelChat,
  PanelProvider,
  PanelSheet,
  PreviewCard,
  ScreenshotCapture,
  SubmitButton,
  VoiceInput,
  mountPanel,
  usePanelContext
});
//# sourceMappingURL=index.js.map