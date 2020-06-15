import React, { useState, useContext, useEffect, useRef} from 'react';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, NativeEventEmitter, 
    Platform, ScrollView, Switch, Text, ToastAndroid, TouchableOpacity, View, 
    StyleSheet, Alert 
} from 'react-native';
import { BluetoothManager } from "react-native-bluetooth-escpos-printer";
import baseAPI from '../api/baseAPI';
import FunctionStorage from '../FunctionStorage'
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon3 from 'react-native-vector-icons/MaterialIcons';

let firmware = '';
_scrollToBottomY = {};
let cmdlist = [];
_listeners = [];

const AES = 'AfHgtzE80a7ZC5G2elGtVUM35WoT6URv'
var {height, width} = Dimensions.get('window');

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
    console.log('_initSetting');
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
            setName('');
            setBoundAddress('');
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
                setName('');
                setBoundAddress('');
            }
        ));
        _listeners.push(DeviceEventEmitter.addListener(
            BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, ()=> {
                ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
            }
        ))
    }
}

const _connect = (device) => {
    setLoading2(true);
    BluetoothManager.connect(device.address)
    .then((s)=>{
        setLoading2(false);
        setBoundAddress(device.address);
        setName(s || 'Không xác định');
        setShowNearDevices(false);
    },(e)=>{
        setLoading2(false);
        alert("Có lỗi khi kết nối tới thiết bị. Vui lòng thử lại");
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
                            _sendCommand(row);
                        }}
                    >
                        <Text style={{color: 'blue'}}>{row}</Text>
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
        if(cmd && cmd.includes('Failed')) {
            let arr = cmd.split('|');
            items.push(
                <View key={new Date().getTime()+i} style={{flexDirection: 'row'}}>
                    <Text style={{marginRight: 5}}>{'> ' + cmd}</Text>
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
                <Text key={new Date().getTime()+i}>{'> ' + cmd}</Text>
            );
        }
    }
    return items;
}

const _updateListCommand = (cmdStr, isLoading) => {
    cmdlist.push(cmdStr);
    setLoading3(isLoading);
    setCmds(Object.assign([], cmdlist));
}

const _getFirmWareAndListCommand = (navigation) => {
    _updateListCommand('Downloading firmware and list of commands ...', true);

    let request = {
        tokenKey: 'aquasoft@Aaqq1122'  // Master token
    };

    baseAPI.post(
        navigation.getParam('userdata').domain + '/getFirmWareAndListCommand', JSON.stringify(request))
    .then((response) => {
        if(response.status === 200) {
            if(response.data.message === "true") {
                fw = FunctionStorage.AESDecrypt(response.data.firmware, AES);
                // Resolve lib aes-js bug
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                fw = fw.replace('\0','');
                setFirmware(Object.assign('', fw));
                setListcommand(response.data.listcommand || []);
                _updateListCommand('Download successfull.', false);
            } else {
                _updateListCommand('Failed get |firmware|. ErrorReasion: ' + response.data.message, false);
            }
        } else {
            _updateListCommand("Failed get |firmware|. StatusCode: " + response.status, false);
        }
    })
    .catch((error) => {
        _updateListCommand("Failed get |firmware|. Code: " + error.toString(), false);
    });
}

const _scan = () => {
    console.log('_scan');
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
    [pairedDs, setPairedDs] = useState([]);
    [foundDs, setFoundDs] = useState([]);
    [boundAddress, setBoundAddress] = useState('');
    [name, setName] = useState('');
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

    _wirte = () => {

    }

    _read = () => {
        
    }

    _sendCommand = (cmd) => {
        if(name) {
            _updateListCommand('Sending command ' + cmd + ' ...', true);
            setTimeout(() => {
                _updateListCommand('Failed send command |' + cmd + '|.', false);
                scrollRef.current.scrollToEnd({animated: true})
            }, 1000);
        }
        else createButtonAlert('No connecting device found. Please connect one and try again.');
    }

    // Effects
    useEffect(() => {
        _initBluetooth();
        _initSetting();
        _getFirmWareAndListCommand(navigation);
    }, [navigation]);

    useEffect(() => {
        _scan();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <View style={{ flexDirection: 'row', marginBottom: 15, marginTop: 15 }}>
                <Icon name='bluetooth' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Bluetooth state: {bleOpend ? <Text style={{color: 'green'}}> ON</Text> : <Text  style={{color: 'red'}}> OFF</Text>}   </Text>
                <Switch style={{position: 'absolute', top: -5, right: 0}} value={bleOpend} onValueChange={(v)=>{
                    setLoading(true);
                    if(!v){
                        BluetoothManager.disableBluetooth().then(()=>{
                            setBleOpend(false);
                            setLoading(false);
                            setFoundDs([]);
                            setPairedDs([]);
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
                        },(err)=>{
                            setLoading(false);
                            alert(err)
                        });
                    }
                }}/>
            </View>
            <View>
                <Button 
                    color="#0394fc" 
                    disabled={loading || !bleOpend} 
                    onPress={()=>{
                        setPairedDs([]);
                        _scan();
                    }} 
                    title={loading ? 'Scanning ...': 'Scan'}
                />
                {loading ? (<ActivityIndicator animating={true}/>) : null}
            </View>        
            <View style={{ flexDirection: 'row' }}>
                <Icon name='bluetooth-connect' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Connecting device: <Text style={{color:"blue"}}>{!name ? 'Chưa kết nối' : name}</Text></Text>
            </View>
            {showNearDevices ? <>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='google-nearby' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Found devices:</Text>
                </View>
                {loading2 ? (<ActivityIndicator animating={true}/>) : null}
                <View style={{flex:1,flexDirection:"column"}}>
                {
                    _renderRow(foundDs)
                }
                </View>
            </> : null}
            <View style={{ flexDirection: 'row' }}>
                <Icon name='lan-connect' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Paired devices:</Text>
            </View>
            <View style={{flex:1,flexDirection:"column"}}>
            {
                _renderRow(pairedDs)
            }
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Icon2 name='terminal' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Terminal:</Text>
            </View>
            <View>
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
                <TouchableOpacity style={{position: 'absolute', top: 20, right: 20}}
                    onPress={() => {
                        cmdlist = [];
                        setCmds(Object.assign([], cmdlist));
                    }}
                >
                    <Icon3 name='clear-all' size={15} color='blue' style={styles.icon}/>
                </TouchableOpacity>
            </View>
            <Button 
                color='#0394fc'
                disabled={loading3 && firmware !== ''}
                onPress = {() =>{
                    _sendCommand('firmware');
                }}
                title = "Cập nhật firmware"/>
            <View style={{ flexDirection: 'row', marginTop: 15 }}>
                <Icon name='apple-keyboard-command' size={15} color='blue' style={styles.icon}/>
                <Text style={styles.title}>Commands:</Text>
            </View>
            <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {
                _renderCommands(listcommand)
            }
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
        flex:1,
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
    icon2: {
        paddingTop: 2,
        paddingRight: 5,
    },
    txtinfo: {
        fontWeight: "bold"
    },
    textAreaContainer: {
        flex: 1,
        height: 200,
        margin: 10,
        padding: 10,
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
    }
});

export default BluetoothScreen;


