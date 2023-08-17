import { init, Ditto, TransportConfig } from '@dittolive/ditto'
require('dotenv').config()

let ditto
let modelCollection
let modelSubscription
let liveModelQuery

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
  config.peerToPeer.lan.isEnabled = true
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

  liveModelQuery = modelCollection.find("isDeleted == false").observeLocal((docs, event) => {
	  for (let i = 0; i < docs.length; i++) {
		  const doc = docs[i]
		  const attachmentToken = doc.at('my_attachment').attachmentToken
		  const attachmentFetcher = modelCollection.fetchAttachment(attachmentToken, async (attachmentFetchEvent) => {
		  switch (attachmentFetchEvent.type) {
			  case 'Completed':
				  const fetchedAttachment = attachmentFetchEvent.attachment
			  	console.log("have file transfer completed")
				break
			  default:
				  console.log('unable to fetch attachment')
			  	break
		  }

		})
	  }
   })
   const presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
   })
}

main()
