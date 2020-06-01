import React, {Component} from 'react';
import {BluetoothEscposPrinter, BluetoothManager} from "react-native-bluetooth-escpos-printer";

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import { Button } from 'react-native-elements';
import {ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View,
    ScrollView,
    DeviceEventEmitter,
    NativeEventEmitter,
    Switch,
    TouchableOpacity,
    Dimensions,
    ToastAndroid} from 'react-native';
import DebugScreen from './DebugScreen';


var {height, width} = Dimensions.get('window');
export default class BluetoothScreen extends Component {
    _listeners = [];

    constructor(props) {
        super(props);
        this.state = {
            devices: null,
            pairedDs:[],
            foundDs: [],
            bleOpend: false,
            loading: true,
            loading2: false,
            boundAddress: '',
            debugMsg: '',
            billInfo: {},
            loading3: false
        }
    }

    _initBluetooth() {
        BluetoothManager.isBluetoothEnabled().then((enabled)=> {
            this.setState({
                loading: false,
                bleOpend: Boolean(enabled),
            })

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
            //                 this.setState({
            //                     loading:false,
            //                 })
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
            this.setState({
                loading:false,
            })
        });
    }

    _initSetting() {
        if (Platform.OS === 'ios') {
            let bluetoothManagerEmitter = new NativeEventEmitter(BluetoothManager);
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
                (rsp)=> {
                    this._deviceAlreadPaired(rsp)
                }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
                this._deviceFoundEvent(rsp)
            }));
            this._listeners.push(bluetoothManagerEmitter.addListener(BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
                this.setState({
                    name: '',
                    boundAddress: ''
                });
            }));
        } else if (Platform.OS === 'android') {
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED, (rsp)=> {
                    this._deviceAlreadPaired(rsp)
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_DEVICE_FOUND, (rsp)=> {
                    this._deviceFoundEvent(rsp)
                }));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_CONNECTION_LOST, ()=> {
                    this.setState({
                        name: '',
                        boundAddress: ''
                    });
                }
            ));
            this._listeners.push(DeviceEventEmitter.addListener(
                BluetoothManager.EVENT_BLUETOOTH_NOT_SUPPORT, ()=> {
                    ToastAndroid.show("Device Not Support Bluetooth !", ToastAndroid.LONG);
                }
            ))
        }
    }

    componentDidMount() {
        this._initBluetooth();
        this._initSetting();
    }

    _deviceAlreadPaired(rsp) {
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
            let pared = this.state.pairedDs;
            pared = pared.concat(ds||[]);
            this.setState({
                pairedDs:pared
            });
        }
    }

    _deviceFoundEvent(rsp) {
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
            let found = this.state.foundDs || [];
            if(found.findIndex) {
                let duplicated = found.findIndex(function (x) {
                    return x.address == r.address
                });
                //CHECK DEPLICATED HERE...
                if (duplicated == -1 && r.name) {
                    found.push(r);
                    this.setState({
                        foundDs: found
                    });
                }
            }
        }
    }

    _renderRow(rows){
        let items = [];
        for(let i in rows){
            let row = rows[i];
            if(row.address) {
                items.push(
                    <TouchableOpacity key={new Date().getTime()+i} style={styles.wtf} onPress={()=>{
                    this.setState({
                        loading:true
                    });
                    BluetoothManager.connect(row.address)
                    .then((s)=>{
                        this.setState({
                            loading:false,
                            boundAddress:row.address,
                            name:s || "Không xác định"
                        })
                    },(e)=>{
                        this.setState({
                            loading:false
                        });
                        alert("Có lỗi khi kết nối tới thiết bị. Vui lòng thử lại");
                    })

                }}><Text style={styles.name}>{row.name || "Không xác định"}</Text><Text
                        style={styles.address}>{row.address}</Text></TouchableOpacity>
                );
            }
        }
        return items;
    }

    _scan() {
        this.setState({
            loading: true
        })
        BluetoothManager.scanDevices()
            .then((s)=> {
                var ss = s;
                var found = ss.found;
                try {
                    found = JSON.parse(found);//@FIX_it: the parse action too weired..
                } catch (e) {
                    //ignore
                }
                var fds =  this.state.foundDs;
                if(found && found.length){
                    fds = found;
                }
                this.setState({
                    foundDs:fds,
                    loading: false
                });
            }, (er)=> {
                this.setState({
                    loading: false
                })
                alert('error' + JSON.stringify(er));
            });
    }

    render() {
        const {navigate} = this.props.navigation;
        return (
            <ScrollView style={styles.container}>
                <Text>{this.state.debugMsg}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='bluetooth' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Trạng thái Bluetooth: {this.state.bleOpend ? <Text style={{color: 'green'}}> BẬT</Text> : <Text  style={{color: 'red'}}> TẮT</Text>}   </Text>
                </View>
                <View>
                <Switch value={this.state.bleOpend} onValueChange={(v)=>{
                this.setState({
                    loading:true
                })
                if(!v){
                    BluetoothManager.disableBluetooth().then(()=>{
                        this.setState({
                            bleOpend:false,
                            loading:false,
                            foundDs:[],
                            pairedDs:[]
                        });
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
                        this.setState({
                            bleOpend:true,
                            loading:false,
                            pairedDs:paired
                        })
                    },(err)=>{
                        this.setState({
                            loading:false
                        })
                        alert(err)
                    });
                }
            }}/>
                    <Button color="#0394fc" disabled={this.state.loading || !this.state.bleOpend} onPress={()=>{
                        this.setState({
                            pairedDs: []
                        });
                        this._scan();
                    }} title={this.state.loading ? 'Đang quét ...': 'Quét'}/>
                    {this.state.loading ? (<ActivityIndicator animating={true}/>) : null}
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='bluetooth-connect' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Thiết bị đang kết nối: <Text style={{color:"blue"}}>{!this.state.name ? 'Không có' : this.state.name}</Text></Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='google-nearby' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Các thiết bị ở gần:</Text>
                </View>
                <View style={{flex:1,flexDirection:"column"}}>
                {
                    this._renderRow(this.state.foundDs)
                }
                </View>
                <View style={{ flexDirection: 'row' }}>
                    <Icon name='lan-connect' size={15} color='blue' style={styles.icon}/>
                    <Text style={styles.title}>Các thiết bị đã ghép đôi:</Text>
                </View>
                <View style={{flex:1,flexDirection:"column"}}>
                {
                    this._renderRow(this.state.pairedDs)
                }
                </View>
                
                <Button color='#0394fc' onPress = {() =>{navigate(DebugScreen);
                }}
                title = "Gửi dữ liệu">
                    
                </Button>
                
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },

    title:{
        width: width,
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
    }
});

BluetoothScreen.navigationOptions = ({ navigation }) => {
    return {
        title: "In hóa đơn",
    }
}
