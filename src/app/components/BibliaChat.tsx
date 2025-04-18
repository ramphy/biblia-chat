'use client';
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Dexie from "dexie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import TopicsPopover from "./TopicsPopover";
import { Plus, Edit, Trash2, Play, StopCircle, Copy, Loader2, Send, Share2, List } from "lucide-react";

// Tipos para los datos
interface Topic {
  id?: number;
  name: string;
  lastMessageDate?: Date;
}

interface ChatMessage {
  id?: number;
  content: string;
  role: "user" | "assistant";
  audioUrl?: string;
  audioBlob?: Blob;
  isDownloading?: boolean;
  finished?: boolean;
  // Guarda las ediciones anteriores como ramas
  branches?: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

interface Chat {
  id?: number;
  topicId: number;
  messages: ChatMessage[];
}

// Base de datos usando Dexie para IndexedDB
class BibliaChatDB extends Dexie {
  topics: Dexie.Table<Topic, number>;
  chats: Dexie.Table<Chat, number>;

  constructor() {
    super("BibliaChatDB");
    this.version(1).stores({
      topics: "++id, name",
      chats: "++id, topicId, messages",
    });
    this.topics = this.table("topics");
    this.chats = this.table("chats");
  }
}

const db = new BibliaChatDB();

const BibliaChat: React.FC = () => {
  // Estados para temas y chat actual
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  // Estados para inputs
  const [newTopicName, setNewTopicName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  // Estados para edición de mensajes
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageValue, setEditMessageValue] = useState("");

  // Cargar temas desde IndexedDB
  const loadTopics = async () => {
    const allTopics = await db.topics.toArray();
    setTopics(allTopics);
  };

  // Cargar o crear chat para un tema seleccionado
  const loadChatForTopic = async (topic: Topic) => {
    const chatsForTopic = await db.chats.where("topicId").equals(topic.id!).toArray();
    if (chatsForTopic.length > 0) {
      setChat(chatsForTopic[0]);
    } else {
      const newChat: Chat = { topicId: topic.id!, messages: [] };
      const id = await db.chats.add(newChat);
      newChat.id = id;
      setChat(newChat);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  // Cargar chat cuando se selecciona un tema
  useEffect(() => {
    if (selectedTopic) {
      loadChatForTopic(selectedTopic);
    } else {
      setChat(null);
    }
  }, [selectedTopic]);

  // Agregar un nuevo tema
  const handleAddTopic = async (name: string) => {
    if(name.trim() === "") return;
    const newTopic: Topic = { name };
    try {
      const id = await db.topics.add(newTopic);
      newTopic.id = id;
      setTopics(prev => [...prev, newTopic]);
      return true;
    } catch (error) {
      console.error("Error adding topic:", error);
      return false;
    }
  };

  // Editar un tema existente
  const handleEditTopic = async (topicId: number, newName: string) => {
    if (newName.trim() === "") return;
    try {
      await db.topics.update(topicId, { name: newName });
      setTopics(topics.map(t => t.id === topicId ? { ...t, name: newName } : t));
      if (selectedTopic?.id === topicId) {
        setSelectedTopic({ ...selectedTopic, name: newName });
      }
      return true;
    } catch (error) {
      console.error("Error editing topic:", error);
      return false;
    }
  };

  // Eliminar tema y su chat asociado
  const handleDeleteTopic = async (topicId: number) => {
    await db.topics.delete(topicId);
    const chatsToDelete = await db.chats.where("topicId").equals(topicId).toArray();
    for (const c of chatsToDelete) {
      if (c.id) await db.chats.delete(c.id);
    }
    setTopics(topics.filter((t) => t.id !== topicId));
    if(selectedTopic?.id === topicId) {
      setSelectedTopic(null);
      setChat(null);
    }
  };

  // Agregar mensaje al chat y solicitar respuesta del endpoint
  const handleAddMessage = async () => {
    if (newMessage.trim() === "") return;
    let currentTopic = selectedTopic;
    if (!currentTopic) {
      const topicName = newMessage.trim().split(/\s+/).slice(0, 3).join(' ') || "Nuevo tema";
      const newTopic: Topic = { name: topicName };
      const topicId = await db.topics.add(newTopic);
      newTopic.id = topicId;
      setTopics((prev) => [...prev, newTopic]);
      setSelectedTopic(newTopic);
      currentTopic = newTopic;
      await loadChatForTopic(newTopic);
    }
    let currentChat = chat;
    if (!currentChat) {
      const chatsForTopic = await db.chats.where("topicId").equals(currentTopic.id!).toArray();
      if (chatsForTopic.length > 0) {
          currentChat = chatsForTopic[0];
      } else {
          const newChat: Chat = { topicId: currentTopic.id!, messages: [] };
          const chatId = await db.chats.add(newChat);
          newChat.id = chatId;
          currentChat = newChat;
      }
      setChat(currentChat);
    }
    // Actualizar lastMessageDate del topic
    await db.topics.update(currentTopic.id!, { lastMessageDate: new Date() });
    setTopics(topics.map(t => t.id === currentTopic.id ? { ...t, lastMessageDate: new Date() } : t));
    
    const userMsg: ChatMessage = { 
      content: newMessage, 
      role: "user",
      created_at: new Date(),
      updated_at: new Date()
    };
    const updatedMessages = [...currentChat.messages, userMsg];
    const updatedChat = { ...currentChat, messages: updatedMessages };
    await db.chats.update(currentChat.id!, { messages: updatedMessages });
    setChat(updatedChat);
    setNewMessage("");
    await sendMessageToEndpoint(updatedChat);
  };

  // Eliminar mensaje del chat
  const handleDeleteMessage = async (msgId: number) => {
    if (!chat) return;
    const updatedMessages = (chat.messages || []).filter((_, index) => index !== msgId);
    const updatedChat = { ...chat, messages: updatedMessages };
    await db.chats.update(chat.id!, { messages: updatedMessages });
    setChat(updatedChat);
  };

  // Iniciar edición de un mensaje copiando el contenido a un input
  const startEditMessage = (msgId: number, currentContent: string) => {
    setEditingMessageId(msgId);
    setEditMessageValue(currentContent);
  };

  // Guardar edición del mensaje, añadiendo el nuevo contenido al historial (branches)
  const handleSaveEdit = async () => {
    if (editingMessageId === null || !chat) return;
    const updatedMessages = chat.messages.map((msg, index) => {
      if (index === editingMessageId) {
        const branches = msg.branches ? [...msg.branches] : [];
        branches.push({ 
          content: editMessageValue, 
          role: msg.role,
          created_at: new Date(),
          updated_at: new Date()
        });
        return { ...msg, branches };
      }
      return msg;
    });
    const updatedChat = { ...chat, messages: updatedMessages };
    await db.chats.update(chat.id!, { messages: updatedMessages });
    setChat(updatedChat);
    setEditingMessageId(null);
    setEditMessageValue("");
  };

  // Función para compartir respuesta del assistant
  const shareMessage = async (index: number) => {
    if (!chat) return;
    const messageObj = chat.messages[index];
    if (!messageObj) return;
    if (messageObj.role !== "assistant") {
      console.warn("El mensaje no es de un assistant, no se comparte.");
      return;
    }
    const message = messageObj.content;
    const shareUrl = "https://biblia.chat";
    if (navigator.share) {
      try {
        await navigator.share({
          title: index > 0 ? "Pregunta: " + chat.messages[index - 1].content : "Mensaje compartido",
          text: message,
          url: shareUrl
        });
      } catch (error) {
        console.error("Error al compartir:", error);
      }
    } else {
      window.prompt("Copie este mensaje", message);
    }
  };

  // Función para copiar el contenido de un mensaje al portapapeles
  const copyMessage = async (index: number) => {
    if (!chat) return;
    const messageObj = chat.messages[index];
    if (!messageObj) return;
    const message = messageObj.content;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        alert("Mensaje copiado al portapapeles.");
      } catch (error) {
        console.error("Error al copiar el mensaje:", error);
      }
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Mensaje copiado al portapapeles.");
    }
  };

  // Función para enviar el mensaje a un endpoint y recibir respuesta del agente
  const sendMessageToEndpoint = async (currentChat: Chat) => {
const api_url = process.env.NEXT_PUBLIC_API_URL || "api.biblia.chat";
setIsSending(true);
const controller = new AbortController();
setAbortCtrl(controller);
    // Agrega un mensaje de "assistant" vacío para la respuesta
    const assistantMsg: ChatMessage = { 
      content: "", 
      role: "assistant",
      created_at: new Date(),
      updated_at: new Date()
    };
    const newMessages = [...currentChat.messages, assistantMsg];
    const newChatState = { ...currentChat, messages: newMessages };
    await db.chats.update(currentChat.id!, { messages: newMessages });
    setChat(newChatState);
    try {
      const response = await fetch(`https://${api_url}/v1/gpt5`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": "fg-1IIP8N6DTO90J8F9FBGV73N27GZZVDNGI56FXRLK"
         },
         body: JSON.stringify({
            stream: true,
            lang: "es",
            type: 1,
            messages: currentChat.messages.map(m => ({ role: m.role, content: m.content }))
         }),
         signal: controller.signal
      });
      if (!response.body) {
        throw new Error("No response body");
      }
      // Streaming: leer la respuesta en chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      // Índice del mensaje de assistant que acabamos de agregar
      const assistantMsgIndex = newMessages.length - 1;
      while (!done) {
        const {done: streamDone, value} = await reader.read();
        done = streamDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split("\n").filter(line => line.trim() !== "");
          for (const line of lines) {
            const trimmedLine = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
            if (trimmedLine === "[DONE]") {
              done = true;
              break;
            }
            try {
              const json = JSON.parse(trimmedLine);
              const textChunk = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content 
                                ? json.choices[0].delta.content 
                                : "";
              newMessages[assistantMsgIndex].content += textChunk;
              await db.chats.update(currentChat.id!, { messages: newMessages });
              setChat({ ...currentChat, messages: newMessages });
            } catch(e) {
              console.error("Stream chunk parse error", e, "chunk:", trimmedLine);
            }
          }
          await db.chats.update(currentChat.id!, { messages: newMessages });
          setChat({ ...currentChat, messages: newMessages });
        }
      }
      setIsSending(false);
      newMessages[assistantMsgIndex].finished = true;
    } catch(error) {
      setIsSending(false);
      console.error("Error fetching message:", error);
      newMessages[newMessages.length - 1].content = "Error al obtener respuesta.";
      await db.chats.update(currentChat.id!, { messages: newMessages });
      setChat({ ...currentChat, messages: newMessages });
    }
  };

  function stopSending() {
    if (abortCtrl) {
      abortCtrl.abort();
    }
  }

  // Estado para audio en reproducción
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // Convierte base64 a Blob
  const base64ToBlob = (base64: string, mime: string) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: mime });
  };

  // Función playMessage utilizando la lógica del ejemplo curl para descargar el audio.
  // Se utiliza FormData y se omite establecer el header "Content-Type".
  const playMessage = async (index: number) => {
    if (!chat) return;
    // Si ya se está reproduciendo audio, detenerlo.
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    const message = chat.messages[index];
    if (!message || !message.content) return;
    message.isDownloading = true;
    await db.chats.update(chat.id!, { messages: chat.messages });
    setChat({ ...chat, messages: chat.messages });
    if (message.audioUrl) {
      message.isDownloading = false;
      await db.chats.update(chat.id!, { messages: chat.messages });
      setChat({ ...chat, messages: chat.messages });
      const audio = new Audio(message.audioUrl);
      setCurrentAudio(audio);
      setPlayingIndex(index);
      audio.play();
      audio.addEventListener("ended", () => {
        setCurrentAudio(null);
        setPlayingIndex(null);
      });
      return;
    }
    const api_url = process.env.NEXT_PUBLIC_API_URL || "api.biblia.chat";
    try {
      const formData = new FormData();
      formData.append("texto", message.content);
      formData.append("lang", "es");
      formData.append("voice", "es-VE-SebastianNeural");
      const response = await fetch(`https://${api_url}/voice`, {
        method: "POST",
        headers: {
          "Authorization": "fg-1IIP8N6DTO90J8F9FBGV73N27GZZVDNGI56FXRLK"
        },
        body: formData
      });
      const base64Audio = await response.text();
      const audioBlob = base64ToBlob(base64Audio, "audio/mpeg");
      const audioUrl = URL.createObjectURL(audioBlob);
      message.isDownloading = false;
      // Almacenar el audio en el mensaje para evitar descargas futuras
      message.audioUrl = audioUrl;
      message.audioBlob = audioBlob;
      await db.chats.update(chat.id!, { messages: chat.messages });
      setChat({ ...chat, messages: chat.messages });
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      setPlayingIndex(index);
      audio.play();
      audio.addEventListener("ended", () => {
        setCurrentAudio(null);
        setPlayingIndex(null);
      });
    } catch(e) {
      console.error("Error in playMessage", e);
      message.isDownloading = false;
      await db.chats.update(chat.id!, { messages: chat.messages });
      setChat({ ...chat, messages: chat.messages });
    }
  };

  // "Reproducir" mensaje de assistant: ahora usando playMessage para reproducir audio.
  // Permite que el parámetro index sea opcional; si no se provee, se busca el índice del mensaje
  const fadeOutAudio = (audio: HTMLAudioElement, duration: number) => {
    const fadeInterval = 50; // ms
    const steps = duration / fadeInterval;
    const stepAmount = audio.volume / steps;
    const fadeTimer = setInterval(() => {
      if (audio.volume > stepAmount) {
        audio.volume = Math.max(0, audio.volume - stepAmount);
      } else {
        clearInterval(fadeTimer);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1.0; // reset volume for future playbacks
        setCurrentAudio(null);
        setPlayingIndex(null);
      }
    }, fadeInterval);
  };

  const stopPlayback = () => {
    if (currentAudio) {
      fadeOutAudio(currentAudio, 1000); // fade out over 1 second
    }
  };

  const handleReproducirMessage = async (msg: ChatMessage, index?: number) => {
    const messageIndex = index !== undefined ? index : (chat ? chat.messages.findIndex(m => m === msg) : -1);
    if (messageIndex === -1) return;
    if (playingIndex === messageIndex && currentAudio) {
      stopPlayback();
    } else {
      await playMessage(messageIndex);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* Área principal del chat */}
      <main className="flex-1 p-4">
      <div className="flex items-center gap-2 mb-4">
        <TopicsPopover
          topics={topics}
          selectedTopic={selectedTopic}
          onSelectTopic={setSelectedTopic}
          onAddTopic={handleAddTopic}
          onEditTopic={handleEditTopic}
          onDeleteTopic={handleDeleteTopic}
          icon={<List className="h-4 w-4" />}
        />
        <h2 className="text-xl font-bold">Chat – {selectedTopic ? selectedTopic.name : ""}</h2>
      </div>
        {chat ? (
          <>
            <div className="mb-4 flex-grow overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
              {chat.messages.length > 0 ? (
                chat.messages.map((msg, index) => (
                <div key={index} className="group">
                  <div className={`mb-2 p-2 rounded ${msg.role === "user" ? "" : "border"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{msg.role === "user" ? "" : "Asistente"}</span>
                      <span 
                        className="text-sm text-gray-500"
                        title={msg.created_at.toLocaleString('es-VE', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric', 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                      >
                        {msg.created_at.toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="mt-1">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {msg.role === "user" && (
                        <React.Fragment>
                          <Button variant="outline" size="icon" aria-label="Editar mensaje" onClick={() => startEditMessage(index, msg.content)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Eliminar mensaje" onClick={() => handleDeleteMessage(index)}>
                            <Trash2 size={16} />
                          </Button>
                        </React.Fragment>
                      )}
                      {msg.role === "assistant" && msg.finished && (
                        <React.Fragment>
                          <Button variant="outline" size="icon" aria-label="Eliminar mensaje" onClick={() => handleDeleteMessage(index)}>
                            <Trash2 size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Escuchar mensaje" onClick={() => handleReproducirMessage(msg, index)} disabled={msg.isDownloading}>
                            {msg.isDownloading ? (
                              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" role="status" aria-live="polite"></span>
                            ) : (
                              playingIndex === index ? <StopCircle size={16} /> : <Play size={16} />
                            )}
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Compartir mensaje" onClick={() => shareMessage(index)}>
                            <Share2 size={16} />
                          </Button>
                          <Button variant="outline" size="icon" aria-label="Copiar mensaje" onClick={() => copyMessage(index)}>
                            <Copy size={16} />
                          </Button>
                        </React.Fragment>
                      )}
                      {msg.role !== "assistant" && (
                        <Button variant="outline" size="icon" aria-label="Copiar mensaje" onClick={() => copyMessage(index)}>
                          <Copy size={16} />
                        </Button>
                      )}
                    </div>
                    {msg.branches && msg.branches.length > 0 && (
                      <div className="mt-1 ml-4 text-sm text-gray-600">
                        <p>Historial de ediciones:</p>
                        <ul>
                          {msg.branches.map((branch, bi) => (
                            <li key={bi}>- {branch.content}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {editingMessageId === index && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={editMessageValue}
                          onChange={(e) => setEditMessageValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit();
                            }
                          }}
                          placeholder="Editar mensaje"
                        />
                        <Button onClick={handleSaveEdit}>Guardar</Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No hay mensajes en este chat.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex-grow overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
              <p className="text-gray-500">El chat se iniciará al enviar el primer mensaje.</p>
            </div>
          </>
        )}
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddMessage();
                }
              }}
              placeholder="Escribe un mensaje..."
            />
          {isSending ? (
            <Button variant="outline" size="icon" aria-label="Detener envío" onClick={stopSending}>
              <StopCircle size={16} />
            </Button>
          ) : (
            <Button variant="outline" size="icon" aria-label="Enviar mensaje" onClick={handleAddMessage}>
              <Send size={16} />
            </Button>
          )}
          </div>
      </main>
    </div>
  );
};

export default BibliaChat;
