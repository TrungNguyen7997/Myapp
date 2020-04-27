import React, {Component} from 'react';
import {
    Text,
    View,
    StyleSheet,
    Platform,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { TextInput } from 'react-native-paper';
import { Button } from 'react-native-elements';


export default class DebugScreen extends Component{
    constructor() {
        super()
        this.manager = new BleManager()
    }
    componentWillMount() {
        console.log("mounted")
        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scanAndConnect();
                subscription.remove();
            }
        }, true);
    }
    monitorDevice = () => {
        this.setState({monitoring: true})
        console.log(this.state.servicesDiscovered)
        if(this.state.servicesDiscovered){
            {this.manager.monitorCharacteristicForDevice(this.state.connectedTo,
                SERVICE_UUID,
                TX_CHARACTERISTIC,
                (error, characteristic) => {
                    if (error) {
                        console.error("Error at receiving data from device", error);
                        return     
                    }
                    else {
                        this.setState({monitoring: true})
                        console.log('monitor success')
                        console.log('monitor success' + characteristic.value);
                        this.state.messagesRecieved.push(characteristic.value)
                    }
                })
            }
          }
          else{
              console.log("Monitor failure")
        }
    }
    scanAndConnect() {
        this.manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                // Handle error (scanning will be stopped automatically)
                return
            }

            console.log(device.name)
            if (device.name === 'HELLO WORLD') {
                // Stop scanning as it's not necessary if you are scanning for one device.
                this.manager.stopDeviceScan();
                console.log(`Found ${device.name}`)
                this.setState({
                    device: device
                })
                // Proceed with connection.
                device.connect()
                    .then((device) => {
                        console.log(device)
                        return device.discoverAllServicesAndCharacteristics()
                    })
                    .then((device) => {
                        console.log(device)
                    })
                    .then((result) => {
                        
                        console.log(result)
                        console.log("connected")
                    })
                    .catch((error) => {
                        // Handle errors
                        console.log(error)
                    });
            }
        });
    }

    send() {
        this.manager.writeCharacteristicWithResponseForDevice("74:DF:BF:23:AF:92",
            this.device.serviceUUIDs[0],
            this.manager.characteristicsForDevice(this.device.id),
            "ok")
            .catch((error) => {
                console.log('error in writing data');
                console.log(error);
            })
    }
    render(){
        return(
            <View styles={{flexDirection : column}}>
            <Text style= {StyleSheet.title}>File gui</Text>
            <TextInput style = {{
                height: 100,
                margin:20,
                padding:10,
                borderColor: 'gray',
                borderWidth: 1
            }}  
            multiline ={true}
            editable={true}
            autoFocus={true}
            >
            </TextInput>

            <Text>
                file da nhan
            </Text>
            <TextInput style = {{
                height: 100,
                margin:20,
                padding:10,
                borderColor: 'gray',
                borderWidth: 1
            }}  
            multiline ={true}
            ></TextInput>
            </View>
           

        )
    }
    
}
const styles = StyleSheet.create({
    title:{
        width: 10,
        backgroundColor: "#eee",
        color:"#232323",
        textAlign:"left"
    }
})