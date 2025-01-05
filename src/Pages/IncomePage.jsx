'use client'

import { useState } from "react"
import Layout from "./Layout"
import { Button } from "../components/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/components/ui/card"
import { Input } from "../components/components/ui/input"
import { Label } from "../components/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/components/ui/dialog"
import { CreditCard, Wallet, PiggyBank, DollarSign, Smartphone, Bitcoin, Plus, Edit, Trash2 } from 'lucide-react'

const iconMap = {
  'Credit Card': <CreditCard className="w-5 h-5" />,
  'Debit Card': <Wallet className="w-5 h-5" />,
  'Savings': <PiggyBank className="w-5 h-5" />,
  'Cash': <DollarSign className="w-5 h-5" />,
  'UPI': <Smartphone className="w-5 h-5" />,
  'Bit Coin': <Bitcoin className="w-5 h-5" />,
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([
    { name: 'Credit Card', balance: 12000, icon: iconMap['Credit Card'] },
    { name: 'Debit Card', balance: 10000, icon: iconMap['Debit Card'] },
    { name: 'Savings', balance: 8000, icon: iconMap['Savings'] },
    { name: 'Cash', balance: 4000, icon: iconMap['Cash'] },
    { name: 'UPI', balance: 20000, icon: iconMap['UPI'] },
    { name: 'Bit Coin', balance: 50000, icon: iconMap['Bit Coin'] },
  ])

  const [editingId, setEditingId] = useState(null)
  const [newAccount, setNewAccount] = useState({ name: '', balance: '' })
  const [isAddingAccount, setIsAddingAccount] = useState(false)

  const handleEdit = (index) => {
    setEditingId(index === editingId ? null : index)
  }

  const handleBalanceChange = (index, newBalance) => {
    const updatedAccounts = [...accounts]
    updatedAccounts[index].balance = Number(newBalance)
    setAccounts(updatedAccounts)
    setEditingId(null)
  }

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.balance) {
      setAccounts([...accounts, {
        name: newAccount.name,
        balance: Number(newAccount.balance),
        icon: iconMap[newAccount.name] || <CreditCard className="w-5 h-5" />
      }])
      setNewAccount({ name: '', balance: '' })
      setIsAddingAccount(false)
    }
  }

  const handleDeleteAccount = (index) => {
    const updatedAccounts = accounts.filter((_, i) => i !== index)
    setAccounts(updatedAccounts)
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <Layout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Balance Card */}
        <Card className="mb-8 bg-primary text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/70">Total Balance</CardDescription>
            <CardTitle className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        {/* Accounts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold px-1">Accounts</h2>
          <div className="grid gap-4">
            {accounts.map((account, index) => (
              <Card key={index} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {account.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{account.name}</h3>
                        {editingId === index ? (
                          <Input
                            type="number"
                            value={account.balance}
                            className="w-32 text-sm"
                            autoFocus
                            onChange={(e) => handleBalanceChange(index, e.target.value)}
                            onBlur={() => setEditingId(null)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Balance: ₹{account.balance.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEdit(index)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => handleDeleteAccount(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Account Button and Dialog */}
          <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="balance" className="text-right">
                    Balance
                  </Label>
                  <Input
                    id="balance"
                    type="number"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleAddAccount}>Add Account</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
    </Layout>
  )
}