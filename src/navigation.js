import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import LoginScreen from './screens/LoginScreen'
import BluetoothScreen from './screens/BluetoothScreen'
// import DebugScreen from './screens/DebugScreen'

const StackNavigator = createStackNavigator(
  {
    Login: {
      screen: LoginScreen
    },
    Bluetooth: {
      screen: BluetoothScreen
    },
    // Debug: {
    //   screen: DebugScreen
    // }
  },
  {
    initialRouteName: 'Login',
    headerMode: 'none',
    mode: 'modal'
  }
)

export default createAppContainer(StackNavigator)