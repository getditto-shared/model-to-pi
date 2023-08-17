import { init, Ditto, TransportConfig } from '@dittolive/ditto'
require('dotenv').config()

let ditto
let modelCollection
let modelSubscription

async function main () {
  // Initialize the Ditto module
  await init()
  ditto = new Ditto({ type: 'onlinePlayground',
    appID: process.env.APP_ID,
    token: process.env.APP_TOKEN,
    enableDittoCloudSync: false
  })

  const config = new TransportConfig()
  config.peerToPeer.bluetoothLE.isEnabled = true
  config.peerToPeer.lan.isEnabled = false
  config.peerToPeer.awdl.isEnabled = false
  const transportConditionsObserver = ditto.observeTransportConditions((condition, source) => {
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

  const modelCollection = ditto.store.collection("models")
  modelSubscription = modelCollection.find("isDeleted == false").subscribe()

  const metadata = { model: 'tester' }
  const attachment = await modelCollection.newAttachment("./file.zip", metadata)
  const docID = await modelCollection.upsert({ model: 'tester', my_attachment: attachment })

  console.log("Upserted attachment")

   const presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
  })

}

main()
