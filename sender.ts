import { init, Ditto, Logger, TransportConfig } from '@dittolive/ditto'
require('dotenv').config()

Logger.minimumLogLevel = 'Info'

async function main() {
  // Initialize the Ditto module
  await init()
  let ditto = new Ditto({
    type: 'onlinePlayground',
    appID: process.env.APP_ID,
    token: process.env.APP_TOKEN,
    enableDittoCloudSync: false
  })

  const config = new TransportConfig()
  config.peerToPeer.bluetoothLE.isEnabled = false
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

  let modelCollection = ditto.store.collection("models")
  let modelSubscription = modelCollection.find("ACK == true").subscribe()
  modelCollection.find("ACK == true").observeLocal((docs, event) => {
    // new docs
    for (let i = 0; i < docs.length; i++) {
      let doc = docs[i]
      Logger.info(`attachment delivery ACKed: ${doc.id}`)
    }
  })

  const attachmentPath = "./"
  const attachmentFilename = "rp.jpg"
  const metadata = { model: 'tester', source: attachmentPath + attachmentFilename}
  const attachment = await modelCollection.newAttachment(attachmentPath + attachmentFilename, metadata)
  const docID = await modelCollection.upsert({
    ACK: false,
    model: 'tester',
    source: attachmentPath,
    filename: attachmentFilename,
    target: './ditto',
    my_attachment: attachment
  })

  console.log("Upserted attachment: ", docID)

  let presence = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
  })

}

main()
