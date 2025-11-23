
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AdminPage() {
    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to the Admin Panel</CardTitle>
                    <CardDescription>
                        This is your central hub for managing the entire application. 
                        Use the sidebar to navigate between different sections.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Here, you can manage users, oversee matches, adjust application settings, and monitor the overall health of the platform. Each section is designed to give you granular control and clear insights.</p>
                </CardContent>
            </Card>
        </div>
    );
}
