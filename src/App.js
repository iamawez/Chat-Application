import { useEffect, useRef, useState } from "react";
import { differenceInMinutes } from 'date-fns';  // Import date-fns function
import { AddIcon } from '@chakra-ui/icons'; 

import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
  background,
  IconButton,
  useStatStyles,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,

} from "@chakra-ui/react";
import Message from "./components/Message";
import {
  onAuthStateChanged,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { app } from "./firebase";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const auth = getAuth(app);
const db = getFirestore(app);

//Login 
const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

//Logout
const logoutHandler = () => signOut(auth);

function App() {
  const [user, setuser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divforscroll = useRef(null);
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      await addDoc(collection(db, "Messages"), {
        text: message,
        uid: user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp(),
      });

     

      // console.log(user.PhotoURL);

      divforscroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error);
    }
  };

  
  //Delete
  const deleteHandler = async (messageId) => {
    try {
      await deleteDoc(doc(db, "Messages", messageId));
    } catch (error) {
      alert(error);
    }
  };


  //Image upload

 
    const [image, setImage] = useState(null);
    const [imageUrls, setImageUrl] = useState(null);


    const handleImageChange = (e)=>{
      if(e.target.files[0]){
        setImage(e.target.files[0]);
      }
    };


    const handleImageUpload = async ()=>{
      try {
        const selectedImage = fileInputRef.current.files[0];
        const storage = getStorage();
        const storageRef = ref(storage, `images/${selectedImage.name || "default-name"}`);
  
        await uploadBytes(storageRef, selectedImage);
  
        const downloadURL = await getDownloadURL(storageRef);
        setImageUrl(downloadURL);
        // setMessage((prevMessage) => `${prevMessage}\n${downloadURL}`);
        onClose(); // Close the modal after uploading
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image. Please try again.");
      }
    };
  
    const fetchAndDisplayImage = async (messageId) => {
      const storage = getStorage();
      const storageRef = ref(storage, `images/${messageId}.jpg`);
    
      try {
        const downloadURL = await getDownloadURL(storageRef);
        setImageUrl((prevImageUrls) => ({ ...prevImageUrls, [messageId]: downloadURL }));
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          console.warn('Image not found. You might want to handle this case.');
          // Set a default image URL or handle the absence of the image.
        } else {
          console.error("Error fetching image:", error);
        }
      }
    };
  
    useEffect(() => {
      // Fetch and display image when the component mounts
      fetchAndDisplayImage();
    }, []);

  useEffect(() => {
    const order = query(
      collection(db, "Messages"),
      orderBy("createdAt", "asc")
    );


    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setuser(data);
    });

    const unsubscribeForMessage = onSnapshot(order, (snap) => {
      const currentTime = new Date();
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          const data = item.data();
          const messageTime = data.createdAt && data.createdAt.toDate();
          if (messageTime && differenceInMinutes(currentTime, messageTime) >= 30) {
            // Delete the message
            deleteHandler(id);
            return null;
          }else{
            return { id, ...data };
          }
        }).filter(Boolean)
      );
    });


    // const unsubscribeForMessage = onSnapshot(order, async (snap) => {
    //   const currentTime = new Date();
    //   const updatedMessages = await Promise.all(
    //     snap.docs.map(async (item) => {
    //       const id = item.id;
    //       const data = item.data();
    //       const messageTime = data.createdAt && data.createdAt.toDate();
  
    //       if (messageTime && differenceInMinutes(currentTime, messageTime) >= 30) {
    //         // Delete the message
    //         deleteHandler(id);
    //         return null;
    //       } else {
    //         // Get download URL for imageUri
    //         let imageUrl = null;
    //         if (data.imageUri) {
    //           const storage = getStorage();
    //           const imageRef = ref(storage, data.imageUri);
    //           imageUrl = await getDownloadURL(imageRef);
    //         }
  
    //         return { id, ...data, imageUrl };
    //       }
    //     })
    //   );
  
    //   setMessages(updatedMessages.filter(Boolean));
    // });

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);

  console.log(imageUrls)
  return (
    <Box bg={"red.50"}>
      {user ? (
        <Container h={"100vh"} bg={"white"}>
          <VStack h="full" paddingY={"4"}>
            <Button onClick={logoutHandler} colorScheme={"red"} w={"full"}>
              Logout
            </Button>

            <VStack
              h="full"
              w={"full"}
              overflowY="auto"
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {messages.map((item) => (
               
                <Message
                  key={item.id}
                  user={item.uid === user.uid ? "me" : "other"}
                  text={item.text}
                  uri={item.uri}
                  imageUrl={item?.id ? imageUrls[item.id] || null : null}               
                      onDelete={() => deleteHandler(item.id)} // Pass deleteHandler to Message componen
                />
               
              ))}
               
              <div ref={divforscroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
              <IconButton
          icon={<AddIcon />}
          colorScheme="red"
          style={{ width: "1px",  height:"3px", padding:"20px"  }}
          onClick={onOpen}
          
        />
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a Message..." required
                />
                <Button colorScheme={"purple"} type="submit">
                  Send
                </Button>
              </HStack>
            </form>
          </VStack>
        </Container>
      ) : (
        <VStack bg={"#413b7a"} justifyContent={"center"} h="100vh">
          <Button onClick={loginHandler} colorScheme={"purple"}>
            Sign In with Google
          </Button>
        </VStack>
      )}


<Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input type="file" ref={fileInputRef} onChange={handleImageChange} />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="green" onClick={handleImageUpload}>
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default App;
