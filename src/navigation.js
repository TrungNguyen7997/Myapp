import { createAppContainer } from 'react-navigation'
import { createStackNavigator } from 'react-navigation-stack'
import BluetoothScreen from './screens/BluetoothScreen'

const StackNavigator = createStackNavigator(
  {
    Bluetooth: {
        screen: BluetoothScreen
    }
  },
  {
    initialRouteName: 'Bluetooth',
    headerMode: 'none',
    mode: 'modal'
  }
)

export default createAppContainer(StackNavigator)