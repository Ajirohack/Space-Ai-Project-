import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import axios from 'axios';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';

type ModuleFormInputs = {
  name: string;
  version: string;
  description: string;
  type: 'internal' | 'external';
  entryPoint: string;
  config: string;
  dependencies: string;
};

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const BackLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const FormContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.text.light};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.text.light};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  background-color: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.text.light};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: border-color 0.2s ease;
  min-height: 120px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 0.25rem;
`;

const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const SubmitButton = styled(Button)`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}dd;
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.text.light};
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.text.light};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

export default function RegisterModulePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ModuleFormInputs>();
  
  // Redirect if user is not an admin
  if (user && !user.permissions.includes('admin')) {
    router.push('/dashboard/modules');
    return null;
  }
  
  const onSubmit = async (data: ModuleFormInputs) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Parse dependencies from comma-separated string
      const dependencies = data.dependencies
        ? data.dependencies.split(',').map(dep => dep.trim()).filter(Boolean)
        : [];
      
      // Parse config from string to JSON
      let config = {};
      try {
        if (data.config) {
          config = JSON.parse(data.config);
        }
      } catch (e) {
        setError('Invalid JSON in configuration field');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare module data
      const moduleData = {
        name: data.name,
        version: data.version,
        description: data.description,
        type: data.type,
        entryPoint: data.entryPoint,
        config,
        dependencies,
      };
      
      // Submit to API
      await axios.post('/api/modules', moduleData);
      
      // Redirect to modules list
      router.push('/dashboard/modules');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register module. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <PageHeader>
        <Title>Register New Module</Title>
        <BackLink href="/dashboard/modules" onClick={(e) => {
          e.preventDefault();
          router.push('/dashboard/modules');
        }}>
          &larr; Back to Modules
        </BackLink>
      </PageHeader>
      
      <FormContainer>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormRow>
            <FormGroup>
              <Label htmlFor="name">Module Name</Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Module name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters"
                  }
                })}
              />
              {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                {...register("version", { 
                  required: "Version is required",
                  pattern: {
                    value: /^\d+\.\d+\.\d+$/,
                    message: "Version must be in format x.y.z (e.g. 1.0.0)"
                  }
                })}
              />
              {errors.version && <ErrorMessage>{errors.version.message}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description", { 
                required: "Description is required",
                minLength: {
                  value: 10,
                  message: "Description must be at least 10 characters"
                }
              })}
            />
            {errors.description && <ErrorMessage>{errors.description.message}</ErrorMessage>}
          </FormGroup>
          
          <FormRow>
            <FormGroup>
              <Label htmlFor="type">Module Type</Label>
              <Select
                id="type"
                {...register("type", { 
                  required: "Module type is required"
                })}
              >
                <option value="internal">Internal</option>
                <option value="external">External</option>
              </Select>
              {errors.type && <ErrorMessage>{errors.type.message}</ErrorMessage>}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="entryPoint">Entry Point</Label>
              <Input
                id="entryPoint"
                {...register("entryPoint", { 
                  required: "Entry point is required"
                })}
              />
              <HelpText>Path to the module's main file</HelpText>
              {errors.entryPoint && <ErrorMessage>{errors.entryPoint.message}</ErrorMessage>}
            </FormGroup>
          </FormRow>
          
          <FormGroup>
            <Label htmlFor="dependencies">Dependencies</Label>
            <Input
              id="dependencies"
              {...register("dependencies")}
              placeholder="module1, module2, module3"
            />
            <HelpText>Comma-separated list of module dependencies</HelpText>
            {errors.dependencies && <ErrorMessage>{errors.dependencies.message}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              {...register("config")}
              placeholder='{"key": "value"}'
            />
            <HelpText>JSON configuration for the module (optional)</HelpText>
            {errors.config && <ErrorMessage>{errors.config.message}</ErrorMessage>}
          </FormGroup>
          
          <ButtonGroup>
            <CancelButton
              type="button"
              onClick={() => router.push('/dashboard/modules')}
            >
              Cancel
            </CancelButton>
            
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Module'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </DashboardLayout>
  );
}