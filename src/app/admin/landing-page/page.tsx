
'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Trash2, PlusCircle, Save } from 'lucide-react';

const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  quote: z.string().min(10, 'Quote must be at least 10 characters'),
  avatar: z.string().url('Must be a valid URL'),
});

const linkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  href: z.string().min(1, 'Href is required'),
});

const socialLinkSchema = z.object({
  platform: z.enum(['Facebook', 'Twitter', 'Instagram']),
  href: z.string().url('Must be a valid URL'),
});

const landingPageSchema = z.object({
  stats: z.object({
    matches: z.string().min(1),
    players: z.string().min(1),
    satisfaction: z.string().min(1),
  }),
  testimonials: z.array(testimonialSchema),
  quickLinks: z.array(linkSchema),
  supportLinks: z.array(linkSchema),
  socialLinks: z.array(socialLinkSchema),
});

type LandingPageFormValues = z.infer<typeof landingPageSchema>;

const defaultValues: LandingPageFormValues = {
    stats: { matches: '10,000+', players: '5,000+', satisfaction: '98%' },
    testimonials: [
      { name: 'Ahmed Khan', title: 'Enthusiast Player', quote: 'This is the best Ludo platform I\'ve ever used.', avatar: 'https://avatar.vercel.sh/ahmed.png' }
    ],
    quickLinks: [{ label: 'Play', href: '/matchmaking' }],
    supportLinks: [{ label: 'FAQ', href: '#' }],
    socialLinks: [{ platform: 'Facebook', href: 'https://facebook.com' }],
}

export default function LandingPageManager() {
  const { firestore } = useFirebase();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<LandingPageFormValues>({
    resolver: zodResolver(landingPageSchema),
    defaultValues,
  });

  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({
    control: form.control,
    name: 'testimonials',
  });
  const { fields: quickLinkFields, append: appendQuickLink, remove: removeQuickLink } = useFieldArray({
    control: form.control,
    name: 'quickLinks',
  });
   const { fields: supportLinkFields, append: appendSupportLink, remove: removeSupportLink } = useFieldArray({
    control: form.control,
    name: 'supportLinks',
  });
  const { fields: socialLinkFields, append: appendSocialLink, remove: removeSocialLink } = useFieldArray({
    control: form.control,
    name: 'socialLinks',
  });

  useEffect(() => {
    if (!firestore) return;
    const fetchContent = async () => {
      const docRef = doc(firestore, 'landingPage', 'content');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        form.reset(docSnap.data() as LandingPageFormValues);
      }
      setIsLoading(false);
    };
    fetchContent();
  }, [firestore, form]);

  const onSubmit = async (data: LandingPageFormValues) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'landingPage', 'content');
    try {
      await setDoc(docRef, data);
      toast.success('Landing page content updated successfully!');
    } catch (error) {
      toast.error('Failed to update content.');
      console.error(error);
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Manage Landing Page Content</CardTitle>
              <CardDescription>Edit the dynamic sections of your public-facing landing page.</CardDescription>
            </CardHeader>
          </Card>

          <Accordion type="multiple" defaultValue={['stats']} className="w-full">
            
            <AccordionItem value="stats">
              <AccordionTrigger className="text-lg font-semibold">Key Statistics</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="stats.matches" render={({ field }) => ( <FormItem><FormLabel>Matches Played</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="stats.players" render={({ field }) => ( <FormItem><FormLabel>Active Players</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="stats.satisfaction" render={({ field }) => ( <FormItem><FormLabel>User Satisfaction</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="testimonials">
              <AccordionTrigger className="text-lg font-semibold">Testimonials</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {testimonialFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg space-y-2 relative">
                         <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeTestimonial(index)}><Trash2 className="h-4 w-4" /></Button>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name={`testimonials.${index}.name`} render={({ field }) => ( <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name={`testimonials.${index}.title`} render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         </div>
                         <FormField control={form.control} name={`testimonials.${index}.avatar`} render={({ field }) => ( <FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                         <FormField control={form.control} name={`testimonials.${index}.quote`} render={({ field }) => ( <FormItem><FormLabel>Quote</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => appendTestimonial({ name: '', title: '', quote: '', avatar: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Testimonial</Button>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="footer-links">
              <AccordionTrigger className="text-lg font-semibold">Footer Links</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className='text-base'>Quick Links</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                       {quickLinkFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-center">
                            <Input placeholder="Label" {...form.register(`quickLinks.${index}.label`)} />
                            <Input placeholder="Href" {...form.register(`quickLinks.${index}.href`)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeQuickLink(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                       ))}
                       <Button type="button" size="sm" variant="outline" onClick={() => appendQuickLink({ label: '', href: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Quick Link</Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className='text-base'>Support Links</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                       {supportLinkFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-center">
                            <Input placeholder="Label" {...form.register(`supportLinks.${index}.label`)} />
                            <Input placeholder="Href" {...form.register(`supportLinks.${index}.href`)} />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeSupportLink(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                       ))}
                       <Button type="button" size="sm" variant="outline" onClick={() => appendSupportLink({ label: '', href: ''})}><PlusCircle className="mr-2 h-4 w-4" /> Add Support Link</Button>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

             <AccordionItem value="social-media">
              <AccordionTrigger className="text-lg font-semibold">Social Media Links</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-2">
                     {socialLinkFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-center">
                          <Controller
                            control={form.control}
                            name={`socialLinks.${index}.platform`}
                            render={({ field }) => (
                                <select {...field} className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="Facebook">Facebook</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="Instagram">Instagram</option>
                                </select>
                            )}
                          />
                          <Input placeholder="https://..." {...form.register(`socialLinks.${index}.href`)} />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                     ))}
                     <Button type="button" size="sm" variant="outline" onClick={() => appendSocialLink({ platform: 'Facebook', href: 'https://' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Social Link</Button>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
