import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import PopuplarJobCard from '../../common/cards/popular/PopularJobCard'
import styles from "./popularjobs.style";
import { COLORS, SIZES } from "../../../constants";
import useFetch from "../../../hooks/useFetch";

const Popularjobs = () => {
  const router = useRouter();

  const { data, isLoading, error } = useFetch("search",
    {
      query: 'developer jobs in chicago',
      page: '1',
      num_pages: '1',
      country: 'us',
      date_posted: 'all'
    } 
  )

  console.log(data)

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>Popular Jobs</Text>
        <TouchableOpacity>
          <Text style={styles.headerBtn}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : 
          (error ? (<Text>Something went wrong: {error}</Text>) : 
            (
              <FlatList
                data={['data1', 'data2', 'data3', 'data4']}
                renderItem={({ item }) => (
                  <PopuplarJobCard
                    item={item}
                    selectedJob={item}
                    handleCardPress={() => router.push(`/details/${item.id}`)}
                  />
                )}
                keyExtractor={(item) => item?.job_id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10, columnGap: SIZES.medium }}
                horizontal
              />
            )
          )
        }
      </View>
    </View>
  );
};

export default Popularjobs;
