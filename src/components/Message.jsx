import React from "react";
import { HStack, Avatar, Text,Image,  IconButton } from "@chakra-ui/react";
import { DeleteIcon } from '@chakra-ui/icons'; 

const Message = ({ text, uri, user = "other", imageUrls,  onDelete }) => {
  console.log(imageUrls)
  // console.log("The profile ", uri)
  return (
    <HStack
      alignSelf={user === "me" ? "flex-end" : "flex-start"}
      borderRadius={"base"}
      bg="gray.100"
      px={user === "me" ? "4" : "2"}
      py={"2"}
    >
      {user === "other" && <Avatar src={uri} />}

      {/* <Text>{text}</Text> */}
      {text ? (
        <Text>{text}</Text>
      ) : (
        <Image src={imageUrls} alt="Uploaded Image" boxSize="150px" objectFit="cover" />
      )}



      {user === "me" && <Avatar src={uri} />}



      {user === "me" && (
        <IconButton
          icon={<DeleteIcon />}
          colorScheme="red"
          style={{ width: "2px",  height:"5px", padding:"18px" , margin:"5px" }}
          onClick={onDelete}
        />
      )}
    </HStack>
  );
};

export default Message;
