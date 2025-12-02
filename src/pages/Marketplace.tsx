import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, ExternalLink, Star, ShoppingBag } from "lucide-react";

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("produits_affiliation")
        .select("*")
        .order("populaire", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Student Marketplace</h1>
            </div>
            <p className="text-muted-foreground">Essential tools and resources for your academic journey</p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="courses">Courses</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No products found</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {product.image_url && <img src={product.image_url} alt={product.nom} className="w-full h-48 object-cover rounded-lg mb-4" />}
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{product.nom}</CardTitle>
                      {product.populaire && <Badge variant="secondary">Popular</Badge>}
                    </div>
                    {product.note && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{product.note}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2 mb-4">{product.description}</CardDescription>
                    {product.prix && <p className="text-2xl font-bold text-primary mb-4">${product.prix}</p>}
                    <Button className="w-full" asChild>
                      <a href={product.lien_affiliation} target="_blank" rel="noopener noreferrer">
                        View Offer <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}