import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Appbar, Title } from 'react-native-paper'
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon2 from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon3 from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';


function Header({ titleText, action, nav, addicon}) {

  return (
    <Appbar.Header style={styles.headerContainer}>
      <View style={styles.container}>
        <Icon name='arrow-left' color='white' size={30} style={styles.icon}
            onPress={() => {
              nav.goBack();
            }}   
        >
        </Icon>
        <Title style={styles.title}>{titleText}</Title>
        {addicon ? 
        <View style={styles.icon2}>
          <TouchableOpacity
            onPress={action} 
          >
            <Icon3 name='add-circle-outline' color='white' size={35}></Icon3>
          </TouchableOpacity>
        </View>
        : 
        <></>}
      </View>
    </Appbar.Header>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#00324F',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  container: {
    flexDirection: "row",
    flex: 1
  },
  title: {
    color: '#FFFFFF'
  },
  icon:{
    marginRight: 10,
    marginLeft: 5
  },
  icon2:{
    marginRight: 10,
    position: 'absolute',
    right: 0,
  }
})

export default Header