import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';

import { SIZES, COLORS, images, icons } from '../constants';
import { Popularjobs, Nearbyjobs, ScreenHeaderBtn, Welcome } from '../components';

const Home = ()=>{
    const router = useRouter();

    return(
        <SafeAreaView style={{flex:1, backgroundColor:COLORS.lightWhite}}>
            <Stack.Screen
                options={{
                    headerStyle: { backgroundColor: COLORS.lightWhite },
                    headerShadowVisible: false,
                    headerLeft: ()=>
                        (
                            <ScreenHeaderBtn 
                                iconUrl={icons.menu}
                                dimension="60%"
                            />
                        ),
                    headerRight: ()=>
                        (
                            <ScreenHeaderBtn 
                                iconUrl={images.profile}
                                dimension="100%"
                            />
                        ),
                    headerTitle: ''
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{flex:1, padding: SIZES.medium}}>
                    <Welcome 

                    /> 
                    <Popularjobs />
                    <Nearbyjobs />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Home;