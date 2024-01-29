import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
  background,
  useStatStyles,
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
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

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
  const [doubleTapMessageId, setDoubleTapMessageId] = useState(null);
  const divforscroll = useRef(null);

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

      divforscroll.current.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      alert(error);
    }
  };

  const doubleTapHandler = (messageId) => {
    console.log("Function")
    if (doubleTapMessageId === messageId) {
      
      handleDeleteMessage(messageId);
      setDoubleTapMessageId(null); // 
    } else {
      // User double-tapped on a different message
      setDoubleTapMessageId(messageId);
    }
  };

  const handleDeleteMessage = async (messageId) =>{
    try{
      await deleteDoc(doc(db, "Messages", messageId))
    }catch(error){
      console.log(error)
    }
  }

  useEffect(() => {
    const order = query(
      collection(db, "Messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setuser(data);
    });

    const unsubscribeForMessage = onSnapshot(order, (snap) => {
      setMessages(
        snap.docs.map((item) => {
          const id = item.id;
          return { id, ...item.data() };
        })
      );
    });

    return () => {
      unsubscribe();
      unsubscribeForMessage();
    };
  }, []);

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
                  onDoubleTap={() => doubleTapHandler(item.id)}
                  showDeleteOption={doubleTapMessageId === item.id}
                />
              ))}
              <div ref={divforscroll}></div>
            </VStack>

            <form onSubmit={submitHandler} style={{ width: "100%" }}>
              <HStack>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a Message..."
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
    </Box>
  );
}

export default App;
