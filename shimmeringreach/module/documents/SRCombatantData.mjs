export class SRCombatantData extends CombatantData {
  static defineSchema() {
    return {
      _id: fields.DOCUMENT_ID,
      actorId: fields.foreignDocumentField({type: documents.BaseActor}),
      tokenId: fields.foreignDocumentField({type: documents.BaseToken}),
      name: fields.STRING_FIELD,
      img: fields.IMAGE_FIELD,
      initiative: fields.NUMERIC_FIELD,
	  order: fields.NUMERIC_FIELD,
      hidden: fields.BOOLEAN_FIELD,
      defeated: fields.BOOLEAN_FIELD,
      flags: fields.OBJECT_FIELD
    }
  }
}