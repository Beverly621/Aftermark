import { mapRecordType } from "@/lib/record-types";
import { RecordArtDirection, RecordRenderer } from "@/types/record";

export class MockRecordRenderer implements RecordRenderer {
  async render(input: RecordArtDirection) {
    await new Promise((resolve) => window.setTimeout(resolve, 1450));
    const recordType = mapRecordType(input);
    return {
      artDirection: { ...input, recordType },
      recordType,
      catalogNumber: input.catalogNumber,
      renderedAt: new Date().toISOString(),
    };
  }
}

export const mockRecordRenderer = new MockRecordRenderer();
