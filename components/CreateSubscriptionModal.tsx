import { icons } from '@/constants/icons'
import dayjs from 'dayjs'
import { clsx } from 'clsx'
import React, { useMemo, useState } from 'react'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native'

const CATEGORY_OPTIONS = [
    'Entertainment',
    'AI Tools',
    'Developer Tools',
    'Design',
    'Productivity',
    'Cloud',
    'Music',
    'Other',
] as const

const FREQUENCY_OPTIONS = ['Monthly', 'Yearly'] as const

const CATEGORY_COLORS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
    Entertainment: '#f6c85f',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    Design: '#b8e8d0',
    Productivity: '#f8d6b3',
    Cloud: '#b9d8ff',
    Music: '#d7c4f3',
    Other: '#d9d4c7',
}

interface CreateSubscriptionModalProps {
    visible: boolean
    onClose: () => void
    onSubmit: (subscription: Subscription) => void
}

const CreateSubscriptionModal = ({ visible, onClose, onSubmit }: CreateSubscriptionModalProps) => {
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [frequency, setFrequency] = useState<(typeof FREQUENCY_OPTIONS)[number]>('Monthly')
    const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('Entertainment')
    const [error, setError] = useState<string | null>(null)

    const isValid = useMemo(() => {
        const parsedPrice = Number(price)
        return name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0
    }, [name, price])

    const resetForm = () => {
        setName('')
        setPrice('')
        setFrequency('Monthly')
        setCategory('Entertainment')
        setError(null)
    }

    const handleClose = () => {
        setError(null)
        onClose()
    }

    const handleSubmit = () => {
        const trimmedName = name.trim()
        const parsedPrice = Number(price)

        if (!trimmedName) {
            setError('Subscription name is required.')
            return
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            setError('Enter a valid positive price.')
            return
        }

        const startDate = dayjs()
        const renewalDate = frequency === 'Monthly' ? startDate.add(1, 'month') : startDate.add(1, 'year')

        onSubmit({
            id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            icon: icons.wallet,
            name: trimmedName,
            category,
            status: 'active',
            startDate: startDate.toISOString(),
            price: Number(parsedPrice.toFixed(2)),
            currency: 'USD',
            billing: frequency,
            renewalDate: renewalDate.toISOString(),
            color: CATEGORY_COLORS[category],
        })

        resetForm()
        onClose()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable className="modal-overlay" onPress={handleClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <Pressable className="modal-container" onPress={(event) => event.stopPropagation()}>
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            className="max-h-full"
                            keyboardShouldPersistTaps="handled"
                            contentContainerClassName="modal-body"
                        >
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className="auth-input"
                                    value={name}
                                    onChangeText={(value) => {
                                        setName(value)
                                        if (error) setError(null)
                                    }}
                                    placeholder="Netflix, Cursor, Figma..."
                                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                    returnKeyType="next"
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className="auth-input"
                                    value={price}
                                    onChangeText={(value) => {
                                        setPrice(value)
                                        if (error) setError(null)
                                    }}
                                    placeholder="9.99"
                                    placeholderTextColor="rgba(0, 0, 0, 0.4)"
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                />
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {FREQUENCY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx(
                                                'picker-option',
                                                frequency === option && 'picker-option-active'
                                            )}
                                            onPress={() => setFrequency(option)}
                                        >
                                            <Text
                                                className={clsx(
                                                    'picker-option-text',
                                                    frequency === option && 'picker-option-text-active'
                                                )}
                                            >
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx(
                                                'category-chip',
                                                category === option && 'category-chip-active'
                                            )}
                                            onPress={() => setCategory(option)}
                                        >
                                            <Text
                                                className={clsx(
                                                    'category-chip-text',
                                                    category === option && 'category-chip-text-active'
                                                )}
                                            >
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {error ? <Text className="auth-error">{error}</Text> : null}

                            <Pressable
                                className={clsx('auth-button', !isValid && 'auth-button-disabled')}
                                disabled={!isValid}
                                onPress={handleSubmit}
                            >
                                <Text className="auth-button-text">Create Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </KeyboardAvoidingView>
            </Pressable>
        </Modal>
    )
}

export default CreateSubscriptionModal
