import { useEffect, useRef, useState } from "react";
import { differenceInMinutes } from "date-fns";
import { AddIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Container,
  HStack,
  Input,
  VStack,
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

const auth = getAuth(app);
const db = getFirestore(app);

const loginHandler = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};

const logoutHandler = () => signOut(auth);

function App() {
  const [user, setuser] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const divforscroll = useRef(null);

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setuser(data);

      // If user is logged in and has not seen the alert
      if (data && !localStorage.getItem("hasShownAlert")) {
        alert("I am adding more features to this application. To ensure your privacy, we have implemented a feature: messages will be automatically deleted after 30 minutes.");
        localStorage.setItem("hasShownAlert", "true");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  // Delete
  const deleteHandler = async (messageId) => {
    try {
      await deleteDoc(doc(db, "Messages", messageId));
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const order = query(
      collection(db, "Messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onAuthStateChanged(auth, (data) => {
      setuser(data);
    });

    const unsubscribeForMessage = onSnapshot(order, async (snap) => {
      const currentTime = new Date();
      const updatedMessages = await Promise.all(
        snap.docs.map(async (item) => {
          const id = item.id;
          const data = item.data();
          const messageTime = data.createdAt && data.createdAt.toDate();

          if (
            messageTime &&
            differenceInMinutes(currentTime, messageTime) >= 30
          ) {
            deleteHandler(id);
            return null;
          } else {
            return { id, ...data };
          }
        })
      );

      setMessages(updatedMessages.filter(Boolean));
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
                  onDelete={() => deleteHandler(item.id)}
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
                  required
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
