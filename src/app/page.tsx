"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Loader2,
  ArrowUp,
  Bot,
  User,
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

const PDF_FILE_PATH = "/documents/handbook.pdf";
const PDF_FILE_NAME = "Buku Panduan";

export default function Home() {
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
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

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const response = await fetch(PDF_FILE_PATH);
        if (!response.ok) {
          throw new Error("Gagal memuat PDF.");
        }
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          setPdfDataUri(e.target?.result as string);
          toast({
            title: "Dokumen Siap",
            description: `Anda sekarang dapat bertanya tentang ${PDF_FILE_NAME}.`,
          });
        };
        reader.onerror = () => {
          throw new Error("Gagal membaca file PDF.");
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Gagal Memuat Dokumen",
          description: "Tidak dapat memuat file PDF. Pastikan file ada di public/documents/handbook.pdf",
        });
      }
    };
    loadPdf();
  }, [toast]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pdfDataUri) {
      toast({
        variant: "destructive",
        title: "Dokumen Belum Siap",
        description: "Harap tunggu dokumen dimuat sepenuhnya.",
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
            <Input
              {...form.register("question")}
              placeholder={pdfDataUri ? `Tanya tentang ${PDF_FILE_NAME}...` : "Memuat dokumen..."}
              className="pl-4 pr-12 py-6 rounded-full bg-card border-border"
              disabled={!pdfDataUri || isLoading}
            />
            <Button type="submit" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-gray-300 rounded-full" disabled={isLoading || !form.formState.isDirty}>
              <ArrowUp className="text-gray-600"/>
              <span className="sr-only">Kirim</span>
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground mt-2">
              Mengobrol dengan: {PDF_FILE_NAME}.
          </div>
        </div>
      </footer>
    </div>
  );
}
