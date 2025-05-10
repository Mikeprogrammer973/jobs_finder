import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import NearbyJobCard from "../../common/cards/nearby/NearbyJobCard";
import styles from "./nearbyjobs.style";
import { COLORS } from "../../../constants";
import useFetch from "../../../hooks/useFetch";

const Nearbyjobs = () => {
  const router = useRouter();

  const { data, isLoading, error } = useFetch("search",
    {
      query: 'python developer',
      num_pages: '7',
      date_posted: 'all'
    } 
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>Nearby Jobs</Text>
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
              data?.map((job) => (
                <NearbyJobCard key={`nearby-job-${job?.job_id}`} job={job} handleNavigate={() => router.push(`/job-details/${job?.job_id}`)} />
              ))
            )
          )
        }
      </View>
    </View>
  );
};

export default Nearbyjobs;
