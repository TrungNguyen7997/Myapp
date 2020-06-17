import React, { useState, useContext, useEffect} from 'react';
import baseAPI from '../api/baseAPI';
import { StyleSheet, View, Image, Switch, Modal } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { Text, Input, Button } from 'react-native-elements';
//import { Context as AuthContext } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

const md5 = require('md5');

const login = (user,pass,navigation) => {
    setMessage("");
    setIsLoading(true);
    let index = -1;
    for(let i = user.length; i >= 0; i --) {
        if(user[i] == '@') {
            index = i;
            break;
        }
    }
    if(index == -1) {
        setMessage("Tên đăng nhập không hợp lệ.");
        setIsLoading(false);
    }
    else {
        let username = user.substring(0, index);
        let domain = user.substring(index + 1 , user.length);
        setMessage("");
        baseAPI.post(
            domain + '/Login2',
            JSON.stringify({
                userName: username,
                passWord: md5(pass)
            }))
        .then((response) => {
            if(response.data.message != "(Quản lý) Đăng nhập thành công") {setMessage(response.data.message);setIsLoading(false);}
            else {
                if (rememberMe === true) {
                //user wants to be remembered.
                    rememberUser(user,pass);
                } else {
                    forgetUser();
                }

                let userdata = {
                    username: username,
                    password: md5(pass),
                    domain: domain,
                    name: response.data.data.Uname,
                    quyentruycap: response.data.data.Permissionlevel,
                    tokenkey: response.data.data.Authcode
                }
                setIsLoading(false);
                navigation.navigate('Bluetooth',{userdata: userdata, name: 'Login'});
            }
            
        })
        .catch((err) => {
            setMessage("Có lỗi trong quá trình đăng nhập.")
            setIsLoading(false);
        });
    }
}

rememberUser = async (user,pass) => {
    try {
      await AsyncStorage.setItem('USER_DATA', user + '(^.^)' + pass);
    } catch (error) {
        console.log(error);
        console.warn('Không thể ghi nhớ phiên đăng nhập');
    }
};

getRememberedUser = async () => {
    try {
      const userdata = await AsyncStorage.getItem('USER_DATA');
      if (userdata !== null) {
        // We have username!!
        setUser(userdata.split('(^.^)')[0]);
        setPass(userdata.split('(^.^)')[1]);
      }
    } catch (error) {
        console.log(error);
        console.warn('Không thể tải thông tin đăng nhập.');
    }
};

forgetUser = async () => {
    try {
    await AsyncStorage.removeItem('USER_DATA');
    } catch (error) {
        console.log(error);
        console.warn('Xóa thông tin đăng nhập thất bại.');
    }
};


const LoginScreen = ({navigation}) => {
    //const { state, login } = useContext(AuthContext);
    [rememberMe, setRememberme] = useState(true);
    [message, setMessage] = useState("");
    [isLoading, setIsLoading] = useState(false);
    [user, setUser] = useState('');
    [pass, setPass] = useState('');

    useEffect(() => {
        getRememberedUser();
    },[navigation]);

    return (
        <>
            <View style={styles.container}>
                <View style={styles.logoContainer}>
                    <Image 
                        style={styles.logo}
                        source={require('../img/logo.png')} 
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.formContainer}>
                    <Input
                        placeholder='Tên đăng nhập'
                        leftIcon={
                            <Icon
                                name='user'
                                size={24}
                                color='blue'
                            />
                          }
                        color='white'  
                        autoCapitalize='none'
                        autoCorrect={false}
                        style={styles.input}
                        value={user}
                        onChangeText={setUser}
                    />
                    <Input
                        placeholder='Mật khẩu'
                        leftIcon={
                            <Icon
                                name='lock'
                                size={24}
                                color='blue'
                            />
                        }
                        color='white'
                        autoCapitalize='none'
                        autoCorrect={false}
                        secureTextEntry
                        style={styles.input}
                        value={pass}
                        onChangeText={setPass}
                    />
                    <View style={{flexDirection: 'row', marginTop: 5}}>
                        <Switch
                            color='blue'
                            value={rememberMe}
                            onValueChange={(value) => setRememberme(value)}
                        />
                        <Text style={{marginTop: 2, fontSize: 16}}>Nhớ đăng nhập</Text>
                    </View>
                </View> 
                <View style={{ alignItems: 'center',marginBottom: 170}}>
                    <Text style={styles.error}>{message}</Text>
                    <Button title={isLoading ? 'Đang kết nối...' : 'Đăng nhập'} style={styles.buttonContainer}
                    onPress={() => { if (!isLoading) login(user, pass, navigation) }} />
                </View>
            </View>
        </>
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logoContainer: {
        alignItems: 'center',
        backgroundColor: '#00324F'
    },
    logo: {
        width: 300,
        height: 200
    },
    error: {
        color: 'red',
        justifyContent: 'center'
    },
    input: {
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
        color: 'white',
        paddingHorizontal: 20,
        fontWeight: 'bold'
    },
    buttonContainer: {
        width: 150,
        borderRadius: 15,
        marginVertical: 15,
        backgroundColor: '#2980b9',
        paddingVertical: 15,
    },
    formContainer: {
        backgroundColor: 'white',
        marginTop: -40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,

        elevation: 6,
        borderRadius: 25,
        alignItems: 'center',
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
        padding: 25
    }
})

export default LoginScreen;

