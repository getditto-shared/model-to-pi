import { init, Ditto, Logger, TransportConfig } from '@dittolive/ditto'
require('dotenv').config()

let ditto
let modelCollection
let modelSubscription

Logger.minimumLogLevel = 'Info'

async function main() {
  // Initialize the Ditto module
  await init()
  ditto = new Ditto({
    type: 'onlinePlayground',
    appID: process.env.APP_ID,
    token: process.env.APP_TOKEN,
    enableDittoCloudSync: false
  })

  const config = new TransportConfig()
  config.peerToPeer.bluetoothLE.isEnabled = true
  config.peerToPeer.lan.isEnabled = true
  config.peerToPeer.awdl.isEnabled = false
  ditto.observeTransportConditions((condition, source) => {
    if (condition === 'BLEDisabled') {
      console.log('BLE disabled')
    } else if (condition === 'NoBLECentralPermission') {
      console.log('Permission missing for BLE')
    } else if (condition === 'NoBLEPeripheralPermission') {
      console.log('Permissions missing for BLE')
    }
  })

  ditto.setTransportConfig(config)
  ditto.startSync()

  modelCollection = ditto.store.collection("models")
  modelSubscription = modelCollection.find("isDeleted == false").subscribe()

  // LiveQuery to grab new documents
  modelCollection.find("ACK == false").observeLocal(async (docs, event) => {
    // new docs
    for (let i = 0; i < docs.length; i++) {
      // get attachmentToken
      let doc = docs[i]
      const attachmentToken = doc.at('my_attachment').attachmentToken
      const attachmentMetadata = doc.at('my_attachment').metadata

      Logger.info(`Attachment metadata: ${attachmentMetadata}`)

      const attachmentFetcher = modelCollection.fetchAttachment(attachmentToken, async (attachmentFetchEvent) => {
        switch (attachmentFetchEvent.type) {
          case 'Completed':
            const fetchedAttachment = attachmentFetchEvent.attachment
            Logger.info(`Have new attachment, writing to local filesystem: ${fetchedAttachment.metadata["source"]}`)
            // write to local path - get from metadata
            break

          default:
            Logger.error('Unable to fetch attachment completely')
            break
        }
      })

      await modelCollection.findById(doc.id).update((mutableDoc) => {
        mutableDoc.at('ACK == true')
      })
    }
  })
  // Fetch attachment for each new doc

  let presence = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
  })

}

main()
