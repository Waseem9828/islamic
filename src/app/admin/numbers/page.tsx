'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

export default function ManageNumbersPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const { data: groups, isLoading } = useCollection(collection(firestore, 'groups'));

  const handleUpdate = async () => {
    if (!selectedGroup || !newNumber) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a group and enter a number.',
      });
      return;
    }

    if (!/^\d{2}$/.test(newNumber)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number',
        description: 'Please enter a 2-digit number.',
      });
      return;
    }
    
    const groupRef = doc(firestore, 'groups', selectedGroup);
    
    // Non-blocking update
    updateDocumentNonBlocking(groupRef, { 
        number: newNumber,
        updatedAt: serverTimestamp() 
    });

    toast({
      title: 'Success!',
      description: `Lucky number for ${groups?.find(g => g.id === selectedGroup)?.name} has been updated to ${newNumber}.`,
    });

    setNewNumber('');
    setSelectedGroup('');
  };


  return (
    <div>
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Manage Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-muted-foreground">Update the daily lucky numbers for each group.</p>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-select">Select Group</Label>
                      <Select value={selectedGroup} onValueChange={setSelectedGroup} disabled={isLoading}>
                        <SelectTrigger id="group-select">
                          <SelectValue placeholder="Choose a group..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groups?.map(group => (
                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                       <Label htmlFor="lucky-number">New Lucky Number (2 digits)</Label>
                       <Input 
                         id="lucky-number"
                         type="text"
                         maxLength={2}
                         value={newNumber}
                         onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ''))}
                         placeholder="e.g., 77"
                       />
                    </div>
                    
                    <Button onClick={handleUpdate} disabled={!selectedGroup || !newNumber || isLoading}>Update Number</Button>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
