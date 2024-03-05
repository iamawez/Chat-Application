import React from "react";
import { HStack, Avatar, Text, IconButton } from "@chakra-ui/react";
import { DeleteIcon } from '@chakra-ui/icons';

const Message = ({ text, uri, user = "other", onDelete }) => {
  return (
    <HStack
      alignSelf={user === "me" ? "flex-end" : "flex-start"}
      borderRadius={"base"}
      bg="gray.100"
      px={user === "me" ? "4" : "2"}
      py={"2"}
    >
      {user === "other" && <Avatar src={uri} />}

      {text && <Text>{text}</Text>}

      {user === "me" && <Avatar src={uri} />}

      {user === "me" && (
        <IconButton
          icon={<DeleteIcon />}
          colorScheme="red"
          onClick={onDelete}
        />
      )}
    </HStack>
  );
};

export default Message;
