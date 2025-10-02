const encoder = new TextEncoder();
const decoder = new TextDecoder();
export function toBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
export function toBase64Url(buffer) {
    return toBase64(buffer).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
export function fromBase64(input) {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
export function fromBase64Url(input) {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
    return fromBase64(padded);
}
export function encodeUtf8(input) {
    return encoder.encode(input);
}
export function decodeUtf8(bytes) {
    return decoder.decode(bytes);
}
export function toArrayBuffer(input) {
    if (input instanceof ArrayBuffer) {
        return input;
    }
    return input.slice().buffer;
}
