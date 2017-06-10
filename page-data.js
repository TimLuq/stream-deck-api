const BufferReader = require('./buffer-reader');
const BufferWriter = require('./buffer-writer');
const buttonConverter = require('./button-converter');

const REPORT_LENGTH = 7819;
const ICON_SIZE = 72;
const PAGE_1_PIXEL_BYTES = 2583 * 3;

const PAGE_1_HEADER = Buffer.from([
  0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x42, 0x4D, 0xF6,
  0x3C, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x48, 0x00, 0x00, 0x00,
  0x48, 0x00, 0x00, 0x00, 0x01, 0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x3C, 0x00, 0x00, 0xC4, 0x0E, 0x00,
  0x00, 0xC4, 0x0E, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const PAGE_2_HEADER = Buffer.from([
  0x02, 0x01, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

// Create these buffers once and re-use them. They're shared by all StreamDeck instances, but since JavaScript is
// single-threaded, we don't need to worry about race conditions.
const page1Buffer = new Buffer(REPORT_LENGTH, 0);
const page2Buffer = new Buffer(REPORT_LENGTH, 0);
const pixelWriter = new BufferWriter(ICON_SIZE * ICON_SIZE * 3);
PAGE_1_HEADER.copy(page1Buffer);
PAGE_2_HEADER.copy(page2Buffer);

function getPageData(imageBuffer, buttonNumber) {
  let reader = new BufferReader(imageBuffer);
  let r, g, b;
  pixelWriter.setPosition(0);

  // Convert the image buffer from RGBA format to BGR.
  while (reader.hasData()) {
    r = reader.readUInt8();
    g = reader.readUInt8();
    b = reader.readUInt8();
    reader.increment(); // Ignore the alpha channel.

    pixelWriter.writeUInt8(b);
    pixelWriter.writeUInt8(g);
    pixelWriter.writeUInt8(r);
  }

  var rawNumber = buttonConverter.buttonToRaw(buttonNumber);
  // Set the button that the image buffer will write to.
  page1Buffer.writeUInt8(rawNumber, 5);
  page2Buffer.writeUInt8(rawNumber, 5);
  // Copy the pixel data to the buffers.
  pixelWriter.copy(page1Buffer, PAGE_1_HEADER.length, 0, PAGE_1_PIXEL_BYTES);
  pixelWriter.copy(page2Buffer, PAGE_2_HEADER.length, PAGE_1_PIXEL_BYTES, pixelWriter.length);

  return { page1Array: Array.from(page1Buffer), page2Array: Array.from(page2Buffer) };
}

module.exports = { getPageData };