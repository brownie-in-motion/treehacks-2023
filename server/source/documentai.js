import { DocumentProcessorServiceClient } from '@google-cloud/documentai'
import config from './config.js'

const client = new DocumentProcessorServiceClient()

const moneyToNumber = (text) => text ? parseInt(text.replace(/\D/g, '')) : undefined

export const process = async (dataUri) => {
  const match = dataUri.match(/data:(.*?);base64,(.*)/)
  if (!match) {
    return
  }
  const [result] = await client.processDocument({
    name: config.googleDocumentAiProcessor,
    fieldMask: {
      paths: ['entities'],
    },
    rawDocument: {
      mimeType: match[1],
      content: match[2],
    }
  })
  const { entities } = result.document
  const total = entities.find(e => e.type === 'total_amount')
  const lineItems = entities.filter(e => e.type === 'line_item')
  const items = lineItems.map(item => ({
    description: item.properties.find(pr => pr.type === 'line_item/description')?.mentionText,
    price: moneyToNumber(item.properties.find(pr => pr.type === 'line_item/amount')?.mentionText),
  })).filter(it => it.price !== undefined)
  if (!total || lineItems.length === 0) {
    return
  }
  const receiptDate = entities.find(e => e.type === 'receipt_date')?.normalizedValue?.text
  const supplierName = entities.find(e => e.type === 'supplier_name')?.normalizedValue?.text
  return {
    supplierName,
    receiptDate,
    total: moneyToNumber(total.normalizedValue.text),
    items,
  }
}
