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
  modelCollection.find("isDeleted == false").observeLocal((docs, event) => {
    // new docs
    for (let i = 0; i < docs.length; i++) {
      // get attachmentToken
      const attachmentToken = doc.at('my_attachment').attachmentToken
      const attachmentMetadata = doc.at('my_attachment').metadata

      Logger.info("Attachment metadata: ", attachmentMetadata)

      const attachmentFetcher = collection.fetchAttachment(attachmentToken, async (attachmentFetchEvent) => {
        switch (attachmentFetchEvent.type) {
          case 'Completed':
            Logger.info('Have new attachment, writing to local filesystem')
            const fetchedAttachment = attachmentFetchEvent.attachment
            // write to local path - get from metadata
            break

          default:
            Logger.error('Unable to fetch attachment completely')
            break
        }
      })
    }
  })
  // Fetch attachment for each new doc

  ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
  })

}

main()
