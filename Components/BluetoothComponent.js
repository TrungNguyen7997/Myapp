import React, {Component} from 'react';
import {View, 
  Text, 
  Switch, 
  StyleSheet, Dimensions, 
  FlatList, 
  NativeModules,
  NativeEventEmitter,
  AppState, 
  Platform,
  PermissionsAndroid,
  TouchableHighlight,
  ScrollView,
  Button} from 'react-native';

import BleManager from 'react-native-ble-manager';

const window = Dimensions.get('window');

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default class bluetooth extends Component{

    constructor(){
        super()
        this.state = {
          
          scanning:false,
          peripherals: new Map(),
          appState: ''
        }
    
        this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
        this.handleStopScan = this.handleStopScan.bind(this);
        this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);
        this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
        this.handleAppStateChange = this.handleAppStateChange.bind(this);
      }
    
      componentDidMount() {
        AppState.addEventListener('change', this.handleAppStateChange);

        BleManager.enableBluetooth()
            .then(() => {
              // Success code
            console.log('The bluetooth is already enabled or the user confirm');
            })
            .catch((error) => {
               // Failure code
              console.log('The user refuse to enable bluetooth');
           });
    
        BleManager.start();
    
        this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
        this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
        this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
        this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );
    
    
    
        if (Platform.OS === 'android' && Platform.Version >= 23) {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                  console.log("Permission is OK");
                } else {
                  PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                    if (result) {
                      console.log("User accept");
                    } else {
                      console.log("User refuse");
                    }
                  });
                }
          });
        }
    
      }
    
      handleAppStateChange(nextAppState) {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
          console.log('App has come to the foreground!')
          BleManager.getConnectedPeripherals([]).then((peripheralsArray) => {
            console.log('Connected peripherals: ' + peripheralsArray.length);
          });
        }
        this.setState({appState: nextAppState});
      }
    
      componentWillUnmount() {
        this.handlerDiscover.remove();
        this.handlerStop.remove();
        this.handlerDisconnect.remove();
        this.handlerUpdate.remove();
      }
      
    
      handleDisconnectedPeripheral(data) {
        let peripherals = this.state.peripherals;
        let peripheral = peripherals.get(data.peripheral);
        if (peripheral) {
          peripheral.connected = false;
          peripherals.set(peripheral.id, peripheral);
          this.setState({peripherals});
        }
        console.log('Disconnected from ' + data.peripheral);
      }
    
      handleUpdateValueForCharacteristic(data) {
        console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value);
      }
    
      handleStopScan() {
        console.log('Scan is stopped');
        this.setState({ scanning: false });
      }
    
      startScan() {
        if (!this.state.scanning) {
          //this.setState({peripherals: new Map()});
          BleManager.scan([], 3, true).then((results) => {
            console.log('Scanning...');
            this.setState({scanning:true});
          });
        }
      }
    
      retrieveConnected(){
        BleManager.getConnectedPeripherals([]).then((results) => {
          if (results.length == 0) {
            console.log('No connected peripherals')
          }
          console.log(results);
          var peripherals = this.state.peripherals;
          for (var i = 0; i < results.length; i++) {
            var peripheral = results[i];
            peripheral.connected = true;
            peripherals.set(peripheral.id, peripheral);
            this.setState({ peripherals });
          }
        });
      }
    
      handleDiscoverPeripheral(peripheral){
        var peripherals = this.state.peripherals;
        console.log('Got ble peripheral', peripheral);
        if (!peripheral.name) {
          peripheral.name = 'No Name'; // no render ra toan no name la the nao?
        }
        peripherals.set(peripheral.id, peripheral);
        this.setState({ peripherals });
      }
    
      test(peripheral) {
        
        if (peripheral){
          if (peripheral.connected){
            BleManager.disconnect(peripheral.id);
          }
          else{
            BleManager.connect(peripheral.id).then(() => {
              let peripherals = this.state.peripherals;
              let p = peripherals.get(peripheral.id);
              if (p) {
                p.connected = true;
                peripherals.set(peripheral.id, p);
                this.setState({peripherals});
              }
              console.log('Connected to ' + peripheral.name);
    
    
              setTimeout(() => {
    
                /* Test read current RSSI value
                BleManager.retrieveServices(peripheral.id).then((peripheralData) => {
                  console.log('Retrieved peripheral services', peripheralData);
    
                  BleManager.readRSSI(peripheral.id).then((rssi) => {
                    console.log('Retrieved actual RSSI value', rssi);
                  });
                });*/
    
                // Test using bleno's pizza example
                // https://github.com/sandeepmistry/bleno/tree/master/examples/pizza
                BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
                  console.log(peripheralInfo);
                  var service = '13333333-3333-3333-3333-333333333337';
                  var bakeCharacteristic = '13333333-3333-3333-3333-333333330003';
                  var crustCharacteristic = '13333333-3333-3333-3333-333333330001';
    
                  setTimeout(() => {
                    BleManager.startNotification(peripheral.id, service, bakeCharacteristic).then(() => {
                      console.log('Started notification on ' + peripheral.id);
                      setTimeout(() => {
                        BleManager.write(peripheral.id, service, crustCharacteristic, [0]).then(() => {
                          console.log('Writed NORMAL crust');
                          BleManager.write(peripheral.id, service, bakeCharacteristic, [1,95]).then(() => {
                            console.log('Writed 351 temperature, the pizza should be BAKED');
                            /*
                            var PizzaBakeResult = {
                              HALF_BAKED: 0,
                              BAKED:      1,
                              CRISPY:     2,
                              BURNT:      3,
                              ON_FIRE:    4
                            };*/
                          });
                        });
    
                      }, 500);
                    }).catch((error) => {
                      console.log('Notification error', error);
                    });
                  }, 200);
                });
    
              }, 900);
            }).catch((error) => {
              console.log('Connection error', error);
            });
          }
        }
      
      }
      write(peripheralId, serviceUUID, characteristicUUID, data, maxByteSize) {
        if (maxByteSize == null) {
          maxByteSize = 20;
        }
        return new Promise((fulfill, reject) => {
          bleManager.write(peripheralId, serviceUUID, characteristicUUID, data, maxByteSize, (error) => {
            if (error) {
              reject(error);
              console.log('Khong gui duoc')
            } else {
              fulfill();
              console.log('gui thanh cong')
            }
          });
        });
      }
    
    
      renderItem(item) {
        const color = item.connected ? '#FFCC99' : '#fff';
        return (
          <TouchableHighlight onPress={() => this.test(item) }>
            <View style={[styles.row, {backgroundColor: color}]}>
              <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
              <Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
              <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
            </View>
          </TouchableHighlight>
        );
      }
    
    render(){
        const list = Array.from(this.state.peripherals.values());
        return(
            <View style={styles.container}>
                <View style = {styles.toolbar}>
                    <Text style = {styles.header}>Bluetooth Device List</Text>
                    <View style = {styles.toolbarButton}>
                    <Text style = {styles.textswitch} >{this.state.switchValue ? 'Scanning': 'Scan'}</Text>
                    <Switch value={this.state.scanning} onValueChange = {(switchValue)=>this.startScan({switchValue})}> 

                    </Switch>
                    </View>
                </View>
                
                <FlatList
                  data={list}
                  renderItem={({ item }) => this.renderItem(item) }
                  keyExtractor={item => item.id}>
              
                </FlatList>        
              
            </View>
            
        )
    }

}
const styles = StyleSheet.create({
    header : {
        textAlign : 'center',
        fontWeight: 'bold',
        fontSize: 20,
        flex: 1,
        marginTop: 10
    
    },
    container: {
        flex:1,
        backgroundColor: '#F7F2E0'
    },
    toolbar:{
        paddingTop:30,
        paddingBottom:30,
        flexDirection:'row'
    },
    toolbarButton:{
        width: 50,
        marginTop: 35,
    },
    deviceName: {
        fontSize: 17,
        color: "black"
    },
    deviceNameWrap: {
        margin: 10,
        borderBottomWidth:1
    },
    textswitch :{
        textAlign : 'center'
    },
    sendButton: {
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: '#FFFFCC',
        height: 40,
        fontWeight: 'bold',
        marginBottom: 2
       
    }
    
}
)