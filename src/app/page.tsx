"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UploadCloud,
  FileText,
  Loader2,
  Send,
  Bot,
  User,
  Settings,
  ArrowUp,
} from "lucide-react";

import { answerQuestionsFromPdf } from "@/ai/flows/answer-questions-from-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  question: z.string().min(1, {
    message: "Question cannot be empty.",
  }),
});

type Message = {
  role: "user" | "bot";
  content: string;
};

export default function Home() {
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfDataUri(e.target?.result as string);
        setMessages([]);
        form.reset();
        toast({
          title: "PDF Diunggah",
          description: `${file.name} berhasil diunggah.`,
        });
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "File Error",
          description: "There was an error reading the file.",
        });
        resetFile();
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        variant: "destructive",
        title: "File Tidak Valid",
        description: "Silakan unggah file PDF yang valid.",
      });
      resetFile();
    }
  };

  const resetFile = () => {
    setPdfDataUri(null);
    setFileName(null);
    setMessages([]);
    form.reset();
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pdfDataUri) {
      toast({
        variant: "destructive",
        title: "Tidak ada PDF",
        description: "Silakan unggah file PDF terlebih dahulu.",
      });
      return;
    }

    const userMessage: Message = { role: "user", content: values.question };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    form.reset();

    try {
      const result = await answerQuestionsFromPdf({
        pdfDataUri,
        question: values.question,
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
            <Image src="/tav-logo.svg" alt="TAv Logo" width={40} height={40} />
            <span className="font-semibold text-lg">TAv-TanyaAviasi</span>
        </div>
        <div className="flex items-center">
            <Image src="/pertamina-logo.svg" alt="Pertamina Logo" width={140} height={40} />
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
                    {msg.role === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                    <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === 'user' && <User className="h-6 w-6 text-primary flex-shrink-0" />}
                </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 my-4 justify-start">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-background">
        <div className="container mx-auto max-w-3xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative">
            <label htmlFor="pdf-upload-button" className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer">
              {pdfDataUri ? <FileText className="text-primary" /> : <UploadCloud className="text-muted-foreground"/>}
            </label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button id="pdf-upload-button" type="button" variant="ghost" size="icon" className="absolute left-1 top-1/2 -translate-y-1/2" onClick={() => fileInputRef.current?.click()}>
               <span className="sr-only">Upload PDF</span>
            </Button>

            <Input
              {...form.register("question")}
              placeholder={fileName ? `Tanya tentang ${fileName}...` : "Unggah PDF untuk memulai..."}
              className="pl-12 pr-12 py-6 rounded-full bg-card border-border"
              disabled={!pdfDataUri || isLoading}
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full" disabled={isLoading || !form.formState.isDirty}>
              <ArrowUp className="text-gray-600"/>
              <span className="sr-only">Kirim</span>
            </Button>
          </form>
          {fileName && (
              <div className="text-center text-xs text-muted-foreground mt-2">
                  Mengobrol dengan: {fileName}. <Button variant="link" size="sm" onClick={resetFile} className="p-0 h-auto text-xs">Ganti file</Button>
              </div>
          )}
        </div>
      </footer>
    </div>
  );
}
