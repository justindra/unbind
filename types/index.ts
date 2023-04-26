declare module 'stream-to-blob' {
  export default function streamToBlob(
    stream: any,
    mimeType?: string
  ): Promise<Blob>;
}
