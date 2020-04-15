/**
 * @format
 */
import React , {Components} from 'react';
import {AppRegistry} from 'react-native';
//import {StackNavigator} from 'react-navigation';
//import App from './App';
//import {name as appName} from './app.json';
import bluetooth from './Components/BluetoothComponent';
//import DetailComponent from './Components/DetailComponent';

//import {MainScreen,DetailScreen} from './screenNames';

//const App = StackNavigator({
//    MainScreen: {
 //       screen : BluetoothComponent,
 //      navigatorOptions:{
 //           headerTitle: 'Home'
  //      }, 
  // },
  //  DetailScreen: {
  //     screen : DetailComponent,
  //    navigatorOptions:{
   //        headerTitle: 'Detail'
  ///     },
  //}
  //  SettingScreen: {
      //  screen : SettingScreen,
    //    navigatorOptions:{
   //         headerTitle: 'Setting'
   //     },
  //  },
//});

AppRegistry.registerComponent('Myapp', () => bluetooth);
