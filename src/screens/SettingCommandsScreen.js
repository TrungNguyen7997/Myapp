import React, { useState, useEffect, useRef} from 'react';
import { ActivityIndicator,  Dimensions, Switch, TouchableOpacity, View, 
    StyleSheet, Alert 
} from 'react-native';
import { Text, Input, Button, SearchBar, CheckBox } from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon3 from 'react-native-vector-icons/MaterialIcons';


// Global and constants variable
var {height, width} = Dimensions.get('window');
old_name = '';
// Functions

const SettingCommandsScreen = ({navigation}) => {
    // State, Ref, Context , ...
    [cmd, setCmd] = useState({});
    [mode, setMode]= useState('');
    // Effect
    useEffect(() => {
        let ud = navigation.getParam('mode');
        setMode(ud);
        let target_cmd = navigation.getParam('target_cmd');
        old_name = target_cmd.name;
        setCmd(Object.assign({}, target_cmd));
        
    }, []);

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

    _saveToStorage = async () => {
        try {
            let cmdjson = await AsyncStorage.getItem('cmdlist');
            if(cmdjson == null) cmdjson = '[]';
            let cmdlist = JSON.parse(cmdjson);
            // console.log(mode);
            if(mode == 'update') {
                for(let i = 0; i < cmdlist.length; i ++) {
                    if(cmdlist[i].name === old_name) {
                        cmdlist[i].name = cmd.name;
                        cmdlist[i].value = cmd.value;
                        break;
                    }
                };
            } else cmdlist.push(cmd);
            await AsyncStorage.setItem('cmdlist', JSON.stringify(cmdlist));
            let userdata = navigation.getParam('userdata');
            navigation.navigate('Bluetooth',{userdata: userdata, name: 'SettingCommands'});
        } catch (error) {
            // console.log(error);
            createButtonAlert(error);
        }
    }

    _deleteFromStorage = async () => {
        try {
            let cmdjson = await AsyncStorage.getItem('cmdlist');
            if(cmdjson == null) cmdjson = '[]';
            let cmdlist = JSON.parse(cmdjson);
            let newlist = [];
            for(let i = 0; i < cmdlist.length; i ++) {
                if(cmdlist[i].name !== old_name) newlist.push(cmdlist[i]);
            };
            await AsyncStorage.setItem('cmdlist', JSON.stringify(newlist));
            let userdata = navigation.getParam('userdata');
            navigation.navigate('Bluetooth',{userdata: userdata, name: 'Bluetooth'});
        } catch (error) {
            // console.log(error);
            createButtonAlert(error);
        }
    }



    return (
        <>
            <View style={styles.itemContainer}>
                <View style={styles.inputContainer}>
                    <Input label='Name'
                        containerStyle={{marginTop: 5}}
                        inputContainerStyle={{borderBottomColor: '#3995e6', borderBottomWidth: 2}}
                        placeholder='Enter name of command'
                        errorStyle={{ color: 'red' }}
                        errorMessage={cmd.name == "" ? 'Name of command require no empty': null}
                        leftIcon={<Icon name='sticky-note-o' size={24} color='#3995e6'/>}
                        leftIconContainerStyle={{marginLeft: 0, marginRight: 5}}
                        value={cmd.name}
                        onChangeText={(value) => {
                            let _data = Object.assign({},cmd);
                            _data.name = value;
                            setCmd(_data);
                        }}
                    />

                    <Input label='Value'
                        containerStyle={{marginTop: 5}}
                        inputContainerStyle={{borderBottomColor: '#3995e6', borderBottomWidth: 2}}
                        placeholder='Enter value of command'
                        leftIcon={<Icon name='sticky-note-o' size={24} color='#3995e6'/>}
                        leftIconContainerStyle={{marginLeft: 0, marginRight: 5}}
                        value={cmd.value}
                        onChangeText={(value) => {
                            let _data = Object.assign({},cmd);
                            _data.value = value;
                            setCmd(_data);
                        }}
                    />
                    <View style={{flex: 1, flexDirection: 'row'}}>
                        {mode == 'update' ? <View style={styles.button}>
                            <Button
                                backgroundColor={'red'} 
                                title={'Xóa'}
                                onPress={() => {
                                    _deleteFromStorage();
                                }}
                            >
                            </Button>
                        </View> : null}
                        <View style={styles.button}>
                        <Button 
                            title={'Lưu'}
                            onPress={() => {
                                _saveToStorage();
                            }}
                        >
                        </Button>
                    </View> 
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    spinnerTextStyle: {
        color: '#FFF'
    },
    scene: {
        flex: 1,
    },
    itemContainer: {
        flex: 1,
    },
    inputContainer: {
        flex: 1,
        marginTop: 5
    },
    headerText: {

    },
    button: {
        flex: 1,
        marginTop: 20,
        marginLeft: 15,
        marginRight: 15,
        marginBottom: 30,
    },
    verify: {
        flex: 1 ,
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30, 
        marginBottom: 30,
    }
});

export default SettingCommandsScreen;