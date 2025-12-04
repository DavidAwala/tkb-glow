import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Product from "./pages/Product";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Delivery from "./pages/Delivery";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutPayment from "./pages/CheckoutPayment";
import CustomerDetail from "./pages/CustomerDetail";
import RevenueAnalytics from "./pages/RevenueAnalytics";
import Order from "./pages/Order";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import AccountOrders from "./pages/AccountOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/customer/:userId" element={<CustomerDetail />} />
            <Route path="/admin/revenue" element={<RevenueAnalytics />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/order/:id" element={<Order />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/account/orders" element={<AccountOrders />} />
            <Route path="/checkout/payment" element={<CheckoutPayment />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
