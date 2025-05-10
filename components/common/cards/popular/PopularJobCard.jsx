import { View, Text, TouchableOpacity, Image } from "react-native";

import styles from "./popularjobcard.style";
import { checkImageUrl } from "../../../../utils";

const PopularJobCard = ({ item, selectedJob, handleCardPress }) => {
  return (
    <TouchableOpacity
      style={styles.container(selectedJob, item)}
      onPress={() => handleCardPress(item)}
    >
      <TouchableOpacity style={styles.logoContainer(selectedJob, item)}> 
        <Image 
          source={{ uri: checkImageUrl(item.employer_logo) ? item.employer_logo : "https://lh3.googleusercontent.com/a/ACg8ocLWUmqhoTGJ2NKtu_omBv1kj6MpmZZ9ySKn1WkAtkpfgWRt8tY=s288-c-no"  }}
          resizeMode="contain"
          style={styles.logoImage}
        />
      </TouchableOpacity>
      <Text style={styles.companyName} numberOfLines={1}> 
        {item.employer_name}
      </Text>

      <View style={styles.infoContainer}>
        <Text style={styles.jobName(selectedJob, item)} numberOfLines={1}>
          {item.job_title}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {item.job_location}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default PopularJobCard;
