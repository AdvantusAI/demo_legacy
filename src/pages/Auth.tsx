
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompanyConfig {
  company_name: string;
  company_logo: string;
}

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    // Fetch company config
    fetchCompanyConfig();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCompanyConfig = async () => {
    try {
      const { data, error } = await supabase
      .schema('m8_schema')
        .from('company_config')
        .select('company_name, company_logo')
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching company config:', error);
        return;
      }

      if (data) {
        setCompanyConfig(data);
      }
    } catch (error) {
      console.error('Error fetching company config:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      toast.error('Error al iniciar sesión: ' + error.message);
    } else {
      toast.success('¡Sesión iniciada exitosamente!');
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {companyConfig?.company_logo && (
            <div className="flex justify-center mb-4">
              <img
                src={companyConfig.company_logo}
                alt={companyConfig.company_name || 'Company Logo'}
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.error('Error loading company logo:', companyConfig.company_logo);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <CardTitle className="text-2xl font-bold">
            {companyConfig?.company_name || 'M8 Platform'}
          </CardTitle>
          <p className="text-muted-foreground">Accede a tu cuenta</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
