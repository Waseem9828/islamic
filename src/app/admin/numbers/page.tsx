
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const groupOptions = [
    { id: 'faridabad', name: 'Faridabad' },
    { id: 'ghaziabad', name: 'Ghaziabad' },
    { id: 'gali', name: 'Gali' },
    { id: 'disawar', name: 'Disawar' },
];

export default function ManageNumbersPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const { toast } = useToast();
  const { firestore } = useFirebase();

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
    
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    
    const groupRef = doc(firestore, 'groups', selectedGroup);
    const selectedGroupName = groupOptions.find(g => g.id === selectedGroup)?.name;

    try {
        await setDoc(groupRef, { 
            id: selectedGroup,
            name: selectedGroupName,
            number: newNumber,
            updatedAt: serverTimestamp() 
        }, { merge: true });

        toast({
          title: 'Success!',
          description: `Lucky number for ${selectedGroupName} has been set to ${newNumber}.`,
        });

        setNewNumber('');
        setSelectedGroup('');
    } catch (error) {
        console.error("Error updating group:", error);
        toast({
            variant: 'destructive',
            title: 'Database Error',
            description: 'Could not update the group. Please try again.',
        });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Manage Numbers</CardTitle>
                <CardDescription>Update or create the daily lucky numbers for each group. This will make them appear on the user dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-select">Select Group</Label>
                      <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger id="group-select">
                          <SelectValue placeholder="Choose a group..." />
                        </SelectTrigger>
                        <SelectContent>
                          {groupOptions.map(group => (
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
                    
                    <Button onClick={handleUpdate} disabled={!selectedGroup || !newNumber}>Update/Create Group</Button>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
