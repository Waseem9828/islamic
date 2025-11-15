'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

// Pre-defined group IDs and names
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
    
    const groupRef = doc(firestore, 'groups', selectedGroup);
    const selectedGroupName = groupOptions.find(g => g.id === selectedGroup)?.name;

    // Non-blocking update/create
    setDocumentNonBlocking(groupRef, { 
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
  };

  return (
    <div>
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>Manage/Create Groups & Numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-muted-foreground">Update or create the daily lucky numbers for each group.</p>
                
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
