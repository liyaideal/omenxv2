import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { SectionWrapper, SubSection } from "../components/SectionWrapper";
import { CodePreview } from "../components/CodePreview";
import { Check, X, ArrowUpDown, MoreHorizontal, Mail, User, Lock, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormsSectionProps {
  isMobile: boolean;
}

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少需要8个字符"),
});

const contactSchema = z.object({
  name: z.string().min(2, "名称至少需要2个字符").max(50, "名称不能超过50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  message: z.string().min(10, "消息至少需要10个字符").max(500, "消息不能超过500个字符"),
  subscribe: z.boolean().default(false),
});

// Sample table data
const tradeHistory = [
  { id: "1", pair: "BTC/YES", type: "Yes", amount: "$500", price: "0.65", pnl: "+$125", status: "closed" },
  { id: "2", pair: "ETH/NO", type: "No", amount: "$300", price: "0.42", pnl: "-$45", status: "closed" },
  { id: "3", pair: "SOL/YES", type: "Yes", amount: "$1,000", price: "0.78", pnl: "+$220", status: "open" },
  { id: "4", pair: "DOGE/YES", type: "Yes", amount: "$200", price: "0.33", pnl: "+$66", status: "open" },
  { id: "5", pair: "ADA/NO", type: "No", amount: "$450", price: "0.55", pnl: "-$90", status: "closed" },
];

const userList = [
  { id: "1", name: "Alice Chen", email: "alice@example.com", role: "Admin", status: "active" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "User", status: "active" },
  { id: "3", name: "Carol Wang", email: "carol@example.com", role: "Moderator", status: "inactive" },
  { id: "4", name: "David Lee", email: "david@example.com", role: "User", status: "pending" },
];

export const FormsSection = ({ isMobile }: FormsSectionProps) => {
  // Table state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Contact form
  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      subscribe: false,
    },
  });

  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    toast.success("Login form submitted!", {
      description: `Email: ${data.email}`,
    });
  };

  const onContactSubmit = (data: z.infer<typeof contactSchema>) => {
    toast.success("Contact form submitted!", {
      description: `From: ${data.name}`,
    });
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === userList.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(userList.map(u => u.id));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-trading-green/10 text-trading-green border-trading-green/20">Active</Badge>;
      case "inactive":
        return <Badge className="bg-muted text-muted-foreground">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-trading-yellow/10 text-trading-yellow border-trading-yellow/20">Pending</Badge>;
      case "open":
        return <Badge className="bg-trading-purple/10 text-trading-purple border-trading-purple/20">Open</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-12">
      {/* Tables Section */}
      <SectionWrapper
        id="tables"
        title="Tables"
        platform="shared"
        description="Data tables for displaying structured information"
      >
        {/* Basic Table */}
        <SubSection title="Basic Table" description="Simple table with caption">
          <Card className="trading-card">
            <CardContent className="pt-6">
              <Table>
                <TableCaption>Recent trade history</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Pair</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeHistory.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium font-mono">{trade.pair}</TableCell>
                      <TableCell>
                        <span className={trade.type === "Yes" ? "text-trading-green" : "text-trading-red"}>
                          {trade.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{trade.amount}</TableCell>
                      <TableCell className="font-mono">{trade.price}</TableCell>
                      <TableCell className={`text-right font-mono ${trade.pnl.startsWith("+") ? "text-trading-green" : "text-trading-red"}`}>
                        {trade.pnl}
                      </TableCell>
                      <TableCell className="text-right">{getStatusBadge(trade.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CodePreview 
            code={`import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

<Table>
  <TableCaption>Recent trade history</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Pair</TableHead>
      <TableHead>Type</TableHead>
      <TableHead className="text-right">P&L</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {trades.map((trade) => (
      <TableRow key={trade.id}>
        <TableCell className="font-medium">{trade.pair}</TableCell>
        <TableCell>{trade.type}</TableCell>
        <TableCell className="text-right">{trade.pnl}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
            collapsible
            defaultExpanded={false}
          />
        </SubSection>

        {/* Interactive Table with Selection */}
        <SubSection title="Interactive Table" description="Table with row selection and status badges">
          <Card className="trading-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>{selectedRows.length} of {userList.length} selected</CardDescription>
                </div>
                {selectedRows.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedRows([])}>
                    Clear Selection
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedRows.length === userList.length}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((user) => (
                    <TableRow 
                      key={user.id}
                      data-state={selectedRows.includes(user.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={selectedRows.includes(user.id)}
                          onCheckedChange={() => toggleRowSelection(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <CodePreview 
            code={`// Interactive table with selection
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[50px]">
        <Checkbox 
          checked={selectedRows.length === userList.length}
          onCheckedChange={toggleAllRows}
        />
      </TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {userList.map((user) => (
      <TableRow 
        key={user.id}
        data-state={selectedRows.includes(user.id) ? "selected" : undefined}
      >
        <TableCell>
          <Checkbox 
            checked={selectedRows.includes(user.id)}
            onCheckedChange={() => toggleRowSelection(user.id)}
          />
        </TableCell>
        <TableCell>{user.name}</TableCell>
        <TableCell>{getStatusBadge(user.status)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
            collapsible
            defaultExpanded={false}
          />
        </SubSection>
      </SectionWrapper>

      {/* Form Validation Section */}
      <SectionWrapper
        id="form-validation"
        title="Form Validation"
        platform="shared"
        description="Forms with Zod schema validation and react-hook-form"
      >
        {/* Login Form */}
        <SubSection title="Login Form" description="Simple validation with required fields">
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Login Form
                </CardTitle>
                <CardDescription>Try submitting with invalid data</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="your@email.com" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>Minimum 8 characters</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Sign In</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Validation Rules Reference */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Validation Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Email</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-trading-green" />
                        Valid email format required
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Password</span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-trading-green" />
                        Minimum 8 characters
                      </li>
                    </ul>
                  </div>
                </div>
                <CodePreview 
                  code={`const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少需要8个字符"),
});`}
                  collapsible
                  defaultExpanded={false}
                />
              </CardContent>
            </Card>
          </div>
        </SubSection>

        {/* Contact Form */}
        <SubSection title="Contact Form" description="Complex validation with multiple field types">
          <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact Form
                </CardTitle>
                <CardDescription>With textarea, checkbox, and character limits</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...contactForm}>
                  <form onSubmit={contactForm.handleSubmit(onContactSubmit)} className="space-y-4">
                    <FormField
                      control={contactForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contactForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contactForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Your message..." 
                              className="min-h-[100px] resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <div className="flex justify-between">
                            <FormMessage />
                            <span className={`text-xs ${field.value.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                              {field.value.length}/500
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contactForm.control}
                      name="subscribe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Subscribe to newsletter</FormLabel>
                            <FormDescription>
                              Receive updates about new features
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Send Message</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Form States */}
            <Card className="trading-card">
              <CardHeader>
                <CardTitle className="text-lg">Form Field States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Default State */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Default</Label>
                  <Input placeholder="Default input state" />
                </div>
                
                {/* Focus State */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Focus (click to see)</Label>
                  <Input placeholder="Click to focus" />
                </div>
                
                {/* Error State */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Error</Label>
                  <Input 
                    placeholder="Error state" 
                    className="border-destructive focus-visible:ring-destructive"
                  />
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    This field is required
                  </p>
                </div>
                
                {/* Success State */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Success</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Success state" 
                      defaultValue="valid@email.com"
                      className="border-trading-green focus-visible:ring-trading-green pr-10"
                    />
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-trading-green" />
                  </div>
                </div>
                
                {/* Disabled State */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Disabled</Label>
                  <Input placeholder="Disabled input" disabled />
                </div>
              </CardContent>
            </Card>
          </div>

          <CodePreview 
            code={`import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const contactSchema = z.object({
  name: z.string().min(2, "名称至少需要2个字符").max(50),
  email: z.string().email("请输入有效的邮箱地址"),
  message: z.string().min(10).max(500),
  subscribe: z.boolean().default(false),
});

const form = useForm<z.infer<typeof contactSchema>>({
  resolver: zodResolver(contactSchema),
  defaultValues: { name: "", email: "", message: "", subscribe: false },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input placeholder="Your name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">Submit</Button>
  </form>
</Form>`}
            collapsible
            defaultExpanded={false}
          />
        </SubSection>

        {/* Inline Validation */}
        <SubSection title="Validation Best Practices" description="Guidelines for form validation UX">
          <Card className="trading-card">
            <CardContent className="pt-6">
              <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                {/* Do's */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-trading-green">
                    <CheckCircle2 className="h-4 w-4" />
                    Best Practices
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                      <span>Show validation on blur, not on every keystroke</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                      <span>Use clear, actionable error messages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                      <span>Indicate required fields clearly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                      <span>Show character counts for limited fields</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-trading-green mt-0.5 flex-shrink-0" />
                      <span>Preserve user input on validation errors</span>
                    </li>
                  </ul>
                </div>
                
                {/* Don'ts */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2 text-trading-red">
                    <X className="h-4 w-4" />
                    Avoid
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                      <span>Generic "Invalid input" errors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                      <span>Clearing form on validation failure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                      <span>Only showing errors after submit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                      <span>Multiple errors at once (overwhelming)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="h-4 w-4 text-trading-red mt-0.5 flex-shrink-0" />
                      <span>Hidden validation requirements</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </SubSection>
      </SectionWrapper>
    </div>
  );
};
