'use client';

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Topic {
  id?: number;
  name: string;
  lastMessageDate?: Date;
}

interface TopicsPopoverProps {
  topics: Topic[];
  selectedTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
  onAddTopic: (name: string) => void;
  onEditTopic: (id: number, newName: string) => void;
  onDeleteTopic: (id: number) => void;
  icon?: React.ReactNode;
}

export default function TopicsPopover({
  topics,
  selectedTopic,
  onSelectTopic,
  onAddTopic,
  onDeleteTopic,
  onEditTopic,
  icon
}: TopicsPopoverProps) {
  const [newTopicName, setNewTopicName] = useState("");
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");

  const handleAddTopic = async () => {
    if (newTopicName.trim() === "") return;
    try {
      await onAddTopic(newTopicName);
      setNewTopicName("");
    } catch (error) {
      console.error("Error adding topic:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {icon || "Temas"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" side="left">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Temas</h2>
          <div className="flex gap-2">
            <Input
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTopic();
                }
              }}
              placeholder="Nuevo tema"
            />
            <Button variant="outline" size="icon" onClick={handleAddTopic}>
              <Plus size={16} />
            </Button>
          </div>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {topics
              .sort((a, b) => {
                if (!a.lastMessageDate) return 1;
                if (!b.lastMessageDate) return -1;
                return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
              })
              .map((topic) => (
              <li
                key={topic.id}
                className={`flex justify-between items-center p-2 rounded group ${
                  selectedTopic?.id === topic.id ? "bg-gray-100" : ""
                }`}
              >
                {editingTopic?.id === topic.id ? (
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={editingTopicName}
                      onChange={(e) => setEditingTopicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editingTopic?.id) {
                          onEditTopic(editingTopic.id, editingTopicName);
                          setEditingTopic(null);
                          setEditingTopicName("");
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => {
                        if (editingTopic?.id) {
                          onEditTopic(editingTopic.id, editingTopicName);
                          setEditingTopic(null);
                          setEditingTopicName("");
                        }
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      className="flex-1 text-left"
                      onClick={() => onSelectTopic(topic)}
                    >
                      {topic.name}
                    </button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTopic(topic);
                          setEditingTopicName(topic.name);
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => topic.id && onDeleteTopic(topic.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
