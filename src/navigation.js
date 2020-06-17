import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import LoginScreen from './screens/LoginScreen'
import BluetoothScreen from './screens/BluetoothScreen'
import SettingCommandsScreen from './screens/SettingCommandsScreen'

const StackNavigator = createStackNavigator(
  {
    Login: {
      screen: LoginScreen
    },
    Bluetooth: {
      screen: BluetoothScreen
    },
    SettingCommands: {
      screen: SettingCommandsScreen
    }
  },
  {
    initialRouteName: 'Login',
    headerMode: 'none',
    mode: 'modal'
  }
)

export default createAppContainer(StackNavigator)