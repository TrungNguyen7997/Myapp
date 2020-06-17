import React, { useState, useContext, useEffect, useRef} from 'react';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, NativeEventEmitter, 
    Platform, ScrollView, Switch, Text, ToastAndroid, TouchableOpacity, View, 
    StyleSheet, Alert 
} from 'react-native';
import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import AsyncStorage from '@react-native-community/async-storage';
import baseAPI from '../api/baseAPI';
import FunctionStorage from '../FunctionStorage'
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon3 from 'react-native-vector-icons/MaterialIcons';
import Icon4 from 'react-native-vector-icons/FontAwesome';
import BluetoothSerial from 'react-native-bluetooth-serial'
import { abs } from 'react-native-reanimated';

let stringReader = '';
_scrollToBottomY = {};
_listeners = [];
senderTimeout = {};
missNumber = 0;
let userdata = {};
const AES = 'AfHgtzE80a7ZC5G2elGtVUM35WoT6URv'
var {height, width} = Dimensions.get('window');
let readInterval = null;

const _deviceAlreadPaired = (rsp) => {
    // console.log('_deviceAlreadPaired');
    var ds = null;
    if (typeof(rsp.devices) == 'object') {
        ds = rsp.devices;
    } else {
        try {
            ds = JSON.parse(rsp.devices);
        } catch (e) {
        }
    }
    if(ds && ds.length) {
        // let pared = Object.assign([], pairedDs);
        let pared = [];
        pared = pared.concat(ds||[]);
        setPairedDs(pared);
    }
}

const _deviceFoundEvent = (rsp) => {
    // console.log('_deviceFoundEvent');
    var r = null;
    try {
        if (typeof(rsp.device) == "object") {
            r = rsp.device;
        } else {
            r = JSON.parse(rsp.device);
        }
    } catch (e) {
        
    }
    if (r) {
        let found = Object.assign([], foundDs || []);
        if(found.findIndex) {
            let duplicated = found.findIndex(function (x) {
                return x.address == r.address
            });
            //CHECK DEPLICATED HERE...
            if (duplicated == -1 && r.name) {
                found.push(r);
                setFoundDs(found);
            }
        }
    }
}

const _initBluetooth = () => {
    BluetoothManager.isBluetoothEnabled().then((enabled)=> {
        setLoading(false);
        setBleOpend(Boolean(enabled));

        // Tự động kết nối
        // BluetoothManager.enableBluetooth().then((r)=>{
        //     console.log(r);
        //     var address = '';
        //     var paired = [];
        //     if(r && r.length>0){
        //         for(var i=0;i<r.length;i++){
        //             try{
        //                 paired.push(JSON.parse(r[i]));
        //                 if(JSON.parse(r[i]).name.includes("Printer")) address = JSON.parse(r[i]).address;
        //             }catch(e){
        //                 setLoading(false);
        //             }
        //         }
        //     }
        //     if(address != '') {
        //         BluetoothManager.connect(address)
        //         .then((s)=>{
        //             this.setState({
        //                 boundAddress:address,
        //                 name:s || "Không xác định",
        //                 bleOpend:true,
        //                 loading:false,
        //                 pairedDs:paired,
        //             })
        //         },(e)=>{
        //             alert('Có lối khi kết nối tới thiết bị')
        //             this.setState({
        //                 loading:false,
        //             })
        //         })
        //     } else {
        //         this.setState({
        //             loading:false,
        //         })
        //     }
        // },(err)=>{
        //     alert(err)
        //     this.setState({
        //         loading:false,
        //     })
        // });

    }, (err)=> {
        err
        setLoading(false);
    });
}

const _initSetting = () => {
    // console.log('_initSetting');
    if (Platform.OS === 'ios') {
        let bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
        _listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
            (rsp)=> {
                _deviceAlreadPaired(rsp)
            }));
        _listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
            _deviceFoundEvent(rsp)
        }));
        _listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
            // setBoundDevice(null);
        }));
    } else if (Platform.OS === 'android') {
        _listeners.push(DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp)=> {
                _deviceAlreadPaired(rsp)
            }));
        _listeners.push(DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
                _deviceFoundEvent(rsp)
            }));
        _listeners.push(DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
                // setBoundDevice(null);
            }
        ));
        _listeners.push(DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, ()=> {
                ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
            }
        ))
    }
}

const _disconnect = () => {
    BluetoothSerial.disconnect().then(()=> {
        console.log("Disconnected from " + boundDevice.address);
        clearInterval(readInterval);
        setConnected(false);
    });
}

const _connect = (device) => {
    _updateListCommand("Connecting to " + device.name + ' ...', true, 'blue');
    setLoading2(true);
    BluetoothSerial.connect(device.address)
    .then((s)=>{
        setLoading2(false);
        setBoundDevice(device);
        setShowNearDevices(false);
        _updateListCommand(s.message, false, 'green');
        setConnected(true);
        _read();
    },(e)=>{
        setLoading2(false);
        _updateListCommand("Có lỗi khi kết nối tới thiết bị. Vui lòng thử lại", false, 'red');
    })
}

const _renderRow = (rows) => {
    let items = [];
    for(let i in rows){
        let row = rows[i];
        if(row.address) {
            items.push(
                <TouchableOpacity 
                    key={new Date().getTime()+i} 
                    style={styles.wtf} 
                    onPress={()=>{
                        _connect(row);
                    }}
                >
                    <Text style={styles.name}>{row.name || "Không xác định"}</Text>
                    <Text style={styles.address}>{row.address}</Text>
                </TouchableOpacity>
            );
        }
    }
    return items;
}

const _renderCommands = (rows) => {
    let items = [];
    for(let i in rows){
        let row = rows[i];
        if(row) {
            items.push(
                <View key={new Date().getTime() + i} style={styles.command}>
                    <TouchableOpacity
                        disabled={loading3}
                        onPress={() => {
                            if(row.name == 'FW') _getFirmWareAndListCommand();
                            else _sendCommand(row);
                        }}
                        onLongPress={() => {
                            _gotoSettingCmd(row, 'update');
                        }}
                    >
                        <Text style={{color: 'blue'}}>{row.name}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
    }
    return items;
}

const _renderTerminalCmd = (cmds) => {
    let items = [];
    for(let i in cmds){
        let cmd = cmds[i];
        if(cmd.text && cmd.text.includes('Failed')) {
            let arr = cmd.text.split('|');
            items.push(
                <View key={new Date().getTime()+i} style={{flexDirection: 'row'}}>
                    <Text style={{marginRight: 5, color: cmd.color}}>{cmd.text}</Text>
                    <TouchableOpacity
                        disabled={loading3}
                        onPress={() => {
                            _sendCommand(arr[1]);
                        }}
                    >
                        <Text style={{color: 'blue'}}>Try again</Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            items.push(
                <Text key={new Date().getTime()+i} style={{color: cmd.color}}>{cmd.text}</Text>
            );
        }
    }
    return items;
}

const _getFirmWareAndListCommand = () => {
    _updateListCommand('Downloading firmware and list of commands ...', true, 'blue');
    let request = {
        tokenKey: 'aquasoft@Aaqq1122'  // Master token
    };

    baseAPI.post(
        userdata.domain + '/getFirmWareAndListCommand', JSON.stringify(request))
    .then((response) => {
        if(response.status === 200) {
            if(response.data.message === "true") {
                let fw = FunctionStorage.AESDecrypt(response.data.firmware, AES);
                // Resolve lib aes-js bug
                for(let i = 0; i < 10 ; i ++) fw = fw.replace('\0','');
                setFirmware(Object.assign('', fw));
                _updateListCommand('Download successfull.', false, 'green');
                _updateListCommand('Updating firmware ...', true, 'blue');
                setTimeout(() => {
                    _updateListCommand('Update firmware successfull.', false, 'green');
                }, 2000);
            } else {
                _updateListCommand('Failed get |firmware|. ErrorReasion: ' + response.data.message, false, 'red');
            }
        } else {
            _updateListCommand("Failed get |firmware|. StatusCode: " + response.status, false, 'red');
        }
    })
    .catch((error) => {
        _updateListCommand("Failed get |firmware|. Code: " + error.toString(), false, 'red');
    });
}

const _scan = () => {
    // console.log('_scan');
    setLoading(true);
    setShowNearDevices(true);
    setFoundDs([]);
    BluetoothManager.scanDevices()
        .then((s)=> {
            var ss = s;
            var found = ss.found;
            try {
                found = JSON.parse(found);//@FIX_it: the parse action too weired..
            } catch (e) {
                //ignore
            }
            var fds =  Object.assign([], foundDs);
            if(found && found.length){
                fds = found;
            }
            setFoundDs(fds);
            setLoading(false);
        }, (er)=> {
            setLoading(false);
            alert('error' + JSON.stringify(er));
        });
}

const BluetoothScreen = ({navigation}) => {
    // Ref define
    const scrollRef = useRef(null);

    // State define
    [connected, setConnected] = useState(false);
    [pairedDs, setPairedDs] = useState([]);
    [foundDs, setFoundDs] = useState([]);
    [boundDevice, setBoundDevice] = useState(null);
    [bleOpend, setBleOpend] = useState(false);
    [loading, setLoading] = useState(false);                    // Loading _scan Device
    [loading2, setLoading2] = useState(false);                  // Loading _download Firmware
    [loading3, setLoading3] = useState(false);                  // Loadding _sendCommand
    [showNearDevices, setShowNearDevices] = useState(false);
    [cmds, setCmds] = useState([]);                             // List msg debug state
    [listcommand, setListcommand] = useState([]);               // List commands
    [firmware, setFirmware] = useState([]);                     // Firmware

    // Functions
    createButtonAlert = (msg) =>
        Alert.alert(
        "Alert",
        msg,
        [
            { text: "Close", onPress: () => {} }
        ],
        { cancelable: false }
    );

    _updateListCommand = (cmdStr, isLoading, color) => {
        let cmdlist = Object.assign([], cmds);
        cmdlist.push({
            text: cmdStr,
            color: color
        });
        setLoading3(isLoading);
        setCmds(Object.assign([], cmdlist));
        setTimeout(() => {
            scrollRef.current.scrollToEnd({animated: false});
        }, 50);
    }

    /**
     * Write message to device
     * @param  {String} message
     */
    _write = (message) => {
        _updateListCommand(message, true, 'blue');
        
        BluetoothSerial.write(message).then((res) => {
            senderTimeout = setTimeout(() => {
                _updateListCommand('Failed to send command or no response', false, 'red');
            }, 10000);
        }).catch((err) => {
            // console.log(err.toString());
            _updateListCommand('Failed send command', false, 'red');
        });
    }

    _read = () => {
        clearInterval(readInterval);
        console.log('On listen {read}');
        stringReader = '';
        readInterval = setInterval(() => {
            BluetoothSerial.readUntilDelimiter('\r\n').then((data) => {
                if(data && data != null && data != '') {
                    clearTimeout(senderTimeout);
                    var currentdate = new Date();
                    var datetime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() + "." + currentdate.getMilliseconds();
                    // console.log('[' + datetime + '] Received: ' + data);
                    stringReader += data;
                } else {
                    missNumber ++;
                    if(missNumber > 5 && stringReader != '') {
                        missNumber = 0;
                        _updateListCommand(stringReader, false, 'green');
                        // console.log('stringReader: ' + stringReader);
                        stringReader = '';
                    }
                }
            })
        }, 50);
    }

    _sendCommand = (cmd) => {
        if(connected) _write('>' + cmd.name + ':' + cmd.value + ';\r\n');
        else createButtonAlert('No connecting device found. Please connect one and try again.');
    }

    _gotoSettingCmd = (cmd, update) => {
        navigation.navigate('SettingCommands', {target_cmd: cmd, userdata: userdata, mode: update});
    }

    // Effects
    useEffect(() => {
        // console.log('BluetoothScreen Effect 1');
        userdata = navigation.getParam('userdata');
        try {
            AsyncStorage.getItem('cmdlist').then((value) => {
                let cmdjson = value.toString() == 'NaN' ? '[]' : value;
                if(cmdjson == null) cmdjson == '[]';
                let _listcmd = JSON.parse(cmdjson);
                setListcommand(_listcmd);
            });
        } catch (error) {
            console.log(error);
            setListcommand([]);
        }
    }, [navigation]);

    useEffect(() => {
        // console.log('BluetoothScreen Effect 2');
        BluetoothSerial.isConnected().then((status) => {
            setCmds([]);
            setConnected(status);
            console.log('Bluetooth State: ' + status);
            if(!status) _scan();
            else _read();
        });
    }, []);

    useEffect(() => {
        // console.log('BluetoothScreen Effect 3');
        _initBluetooth();
        _initSetting();
    }, [])

    return (
        <ScrollView style={styles.container}>
            <View style={{ flexDirection: 'row', marginBottom: 5, marginTop: 5 }}>
                <Icon name='bluetooth-connect' size={15} color='blue' style={styles.icon}/>
                <View style={{flexDirection: 'row'}}>
                    <Text style={styles.title}>Status: 
                        <Text
                            disabled={loading || loading3} 
                            onPress={() => {
                                if((connected && connected === true)) _disconnect();
                                else {
                                    if(boundDevice != null) _connect(boundDevice);
                                }
                            }}
                            style={{color: (connected && connected === true) ? "green": 'red'}}
                        >
                            {(connected && connected === true) ? "  Đã kết nối ": "  Ngắt kết nối "}
                            {(boundDevice !== null) ? ('(' + (boundDevice.name || 'Chưa xác đinh') + ')') : "(-)"}
                        </Text>
                    </Text>
                </View>
                <Switch style={{position: 'absolute', top: -5, right: 0}} value={bleOpend} onValueChange={(v)=>{
                    setLoading(true);
                    if(!v){
                        BluetoothManager.disableBluetooth().then(()=>{
                            setBleOpend(false);
                            setLoading(false);
                            setFoundDs([]);
                            setPairedDs([]);
                            setConnected(false);
                        },(err)=>{alert(err)});
                    }else{
                        BluetoothManager.enableBluetooth().then((r)=>{
                            var paired = [];
                            if(r && r.length>0){
                                for(var i=0;i<r.length;i++){
                                    try{
                                        paired.push(JSON.parse(r[i]));
                                    }catch(e){
                                        //ignore
                                    }
                                }
                            }
                            setBleOpend(true);
                            setLoading(false);
                            setPairedDs(paired);
                            _scan();
                        },(err)=>{
                            setLoading(false);
                            alert(err)
                        });
                    }
                }}/>
                {loading ? (<ActivityIndicator style={{position: 'absolute', top: 0, right: 57}} animating={true}/>) 
                : 
                <TouchableOpacity style={{position: 'absolute', top: 0, right: 50}}
                    onPress={()=>{
                        setPairedDs([]);
                        _scan();
                    }} 
                    disabled={loading || !bleOpend}
                >
                    <Text style={{color: 'blue'}}>{'SCAN'}</Text>
                </TouchableOpacity>
                }
            </View>  
                     
            {showNearDevices ? <>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='google-nearby' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Found devices:</Text>
                </View>
                <View style={{flexDirection:"column"}}>
                {
                    _renderRow(foundDs)
                }
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='lan-connect' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Paired devices:</Text>
                </View>
                <View style={{flexDirection:"column"}}>
                {
                    _renderRow(pairedDs)
                }
                </View>
            </> : null}
         
            <View style={{ flexDirection: 'row' }}>
                <Icon2 name='terminal' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Terminal:</Text>
            </View>
            <View style={{flex: 1}}>
                <ScrollView 
                    onContentSizeChange={(contentWidth, contentHeight)=>{
                        _scrollToBottomY = contentHeight;
                    }}
                    style={styles.textAreaContainer} 
                    ref={scrollRef}
                >
                    <View style={{marginBottom: 50}}>
                        {_renderTerminalCmd(cmds)}
                    </View>
                </ScrollView>
                {loading3 ? (<ActivityIndicator style={{position: 'absolute', top: 50, right: 23}} animating={true}/>) : null}
                <TouchableOpacity style={{position: 'absolute', top: 15, right: 15}}
                    onPress={() => {
                        setCmds([]);
                    }}
                >
                    <Icon4 name='trash-o' size={24} color='red' style={styles.icon}/>
                </TouchableOpacity>
            </View>
            <View style={{flex: 1}}>
                <View style={{ flexDirection: 'row', marginTop: 15 }}>
                    <Icon name='apple-keyboard-command' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Commands:</Text>
                </View>
                <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {
                    _renderCommands(listcommand)
                }
                <View style={styles.command2}>
                    <TouchableOpacity
                        disabled={loading3}
                        onPress={() => {
                            _gotoSettingCmd({name: 'cmd', value: ''}, 'create');
                        }}
                    >
                        <Icon3 name='add-circle-outline' size={25} color='green' style={styles.icon3} />
                    </TouchableOpacity>
                </View>
                </View>
            </View>   
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },

    title:{
        width:width,
        backgroundColor:"#eee",
        color:"#232323",
        textAlign:"left"
    },
    wtf:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center"
    },
    name: {
        marginLeft:25,
        flex:1,
        textAlign:"left"
    },
    address: {
        flex:1,
        textAlign:"right"
    },
    billinfo: {
        flex:1,
        alignItems:"center",
        marginTop: 10,
        marginBottom: 10
    },
    icon: {
        backgroundColor:"#eee",
        paddingLeft:5,
        paddingTop: 2,
        paddingRight: 5,
    },
    icon3: {
        backgroundColor:"white",
        paddingLeft:5,
        paddingTop: 2,
        paddingRight: 5,
    },
    icon2: {
        paddingTop: 2,
        paddingRight: 5,
    },
    txtinfo: {
        fontWeight: "bold"
    },
    textAreaContainer: {
        flex: 1,
        height: 350,
        margin: 5,
        padding: 5,
        borderColor: '#0394fc',
        borderRadius: 5,
        borderWidth: 1,
    },
    command: {
        padding: 5, 
        borderColor: 'blue', 
        borderWidth: 1,
        borderRadius: 5,
        margin: 5
    },
    command2: {
        padding: 2, 
        borderColor: 'green', 
        borderWidth: 1,
        borderRadius: 5,
        margin: 2
    }
});

export default BluetoothScreen;


