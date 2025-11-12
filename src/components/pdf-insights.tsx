"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  Wand2,
  MessageSquare,
  Bot,
} from "lucide-react";

import { answerQuestionsFromPdf } from "@/ai/flows/answer-questions-from-pdf";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  question: z.string().min(10, {
    message: "Question must be at least 10 characters.",
  }),
});

export function PdfInsights() {
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfDataUri(e.target?.result as string);
        setAnswer(null);
        form.reset();
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
        title: "Invalid File",
        description: "Please upload a valid PDF file.",
      });
      resetFile();
    }
  };

  const resetFile = () => {
    setPdfDataUri(null);
    setFileName(null);
    setAnswer(null);
    form.reset();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!pdfDataUri) {
      toast({
        variant: "destructive",
        title: "No PDF",
        description: "Please upload a PDF file first.",
      });
      return;
    }

    setIsLoading(true);
    setAnswer(null);

    try {
      const result = await answerQuestionsFromPdf({
        pdfDataUri,
        question: values.question,
      });
      setAnswer(result.answer);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Failed to get an answer from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">PDF Insights AI</CardTitle>
        <CardDescription className="text-lg text-muted-foreground">
          Get instant answers from your PDF documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!pdfDataUri ? (
          <div className="relative">
            <label
              htmlFor="pdf-upload"
              className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
              </div>
            </label>
            <Input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="font-medium truncate" title={fileName || ''}>{fileName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={resetFile} aria-label="Remove file" disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {pdfDataUri && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-base font-semibold">
                      <MessageSquare className="h-5 w-5" />
                      Ask a question
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., What is the main conclusion of this document?"
                        className="min-h-[100px] text-base resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-base py-6 font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Analyzing..." : "Get Answer"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      {(isLoading || answer) && (
        <CardFooter className="flex-col items-start gap-4">
          <div className="flex items-center gap-2 font-semibold text-base">
            <Bot className="h-6 w-6 text-primary" />
            AI Response
          </div>
          <div className="p-4 border rounded-lg w-full bg-background min-h-[120px]">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[75%]" />
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-foreground/90">{answer}</p>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
