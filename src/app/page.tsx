
"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowUp,
  User,
  Settings,
  RotateCcw,
  LogOut
} from "lucide-react";
import { useRouter } from 'next/navigation';


import { answerQuestionsFromText } from "@/ai/flows/answer-questions-from-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/app/auth/auth-context';


const formSchema = z.object({
  question: z.string().min(1, {
    message: "Question cannot be empty.",
  }),
});

type Message = {
  role: "user" | "bot";
  content: string;
};

const TEXT_FILE_PATH = "/documents/handbook.txt";

function ChatPage() {
  const [textDataUri, setTextDataUri] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  useEffect(() => {
    // Jika loading selesai dan tidak ada user, arahkan ke login
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const loadText = async () => {
      try {
        const response = await fetch(TEXT_FILE_PATH);
        if (!response.ok) {
          throw new Error("Gagal memuat file teks.");
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          setTextDataUri(e.target?.result as string);
        };
        reader.onerror = () => {
          throw new Error("Gagal membaca file teks.");
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Gagal Memuat Dokumen",
          description: "Tidak dapat memuat file teks. Pastikan file ada di public/documents/handbook.txt",
        });
      }
    };
    loadText();
  }, [toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!textDataUri) {
      toast({
        variant: "destructive",
        title: "Dokumen Belum Siap",
        description: "Harap tunggu dokumen dimuat sepenuhnya.",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: values.question };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    form.reset();

    try {
      const result = await answerQuestionsFromText({
        textDataUri,
        question: values.question,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });
      const botMessage: Message = { role: "bot", content: result.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: "bot",
        content: "Maaf, terjadi kesalahan saat mengambil jawaban. Silakan coba lagi.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Gagal mendapatkan jawaban dari AI. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetChat = () => {
    setMessages([]);
  };

  const handleLogout = async () => {
    await signOut();
  };
  
  // Menampilkan layar loading saat status otentikasi sedang diperiksa
  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-bounce-1"></div>
                <div className="w-4 h-4 rounded-full bg-green-500 animate-bounce-2"></div>
                <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce-3"></div>
            </div>
            <p className="text-muted-foreground">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Image src="/tav-logo.png" alt="TAv Logo" width={40} height={40} />
            <span className="font-semibold text-lg">TAv-TanyaAviasi</span>
        </div>
        <div className="flex items-center">
            <Image src="/pertamina-logo.png" alt="Pertamina Logo" width={140} height={40} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {messages.length === 0 && !isLoading && (
            <div className="text-center">
                <h1 className="text-4xl font-bold">Halo, Perwira.</h1>
                <p className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
                    Ada yang bisa dibantu?
                </p>
            </div>
        )}
        
        <div className="w-full max-w-3xl space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && <Image src="/tav-logo.png" alt="TAv Logo" width={24} height={24} className="h-6 w-6 flex-shrink-0" />}
                    <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && <User className="h-6 w-6 text-primary flex-shrink-0" />}
                </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 my-4 justify-start">
                  <Image src="/tav-logo.png" alt="TAv Logo" width={24} height={24} className="h-6 w-6 flex-shrink-0" />
                  <div className="p-3 rounded-lg bg-muted flex items-center space-x-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce-1"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce-2"></div>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce-3"></div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Pengaturan</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={handleResetChat}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Reset Percakapan</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <form onSubmit={form.handleSubmit(onSubmit)} className="relative flex-1">
              <Input
                {...form.register("question")}
                placeholder={textDataUri ? `Tanya Aviasi...` : "Memuat dokumen..."}
                className="pl-4 pr-12 py-6 rounded-full bg-card border-border"
                disabled={!textDataUri || isLoading}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full ${form.watch("question") ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'}`} 
                disabled={isLoading || !form.watch("question")}
              >
                <ArrowUp className={form.watch("question") ? 'text-white' : 'text-gray-600'}/>
                <span className="sr-only">Kirim</span>
              </Button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ChatPage />
  );
}
